import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as Queue from './utils/queue';
import { readdir, readFile } from 'fs/promises';
import { Option, some, map, none, Some, isSome, fromNullable } from 'fp-ts/Option';
import { Dirent, existsSync } from 'fs';
import { parse } from '@iarna/toml';
import { showError } from './utils/error';
import { pipe } from 'fp-ts/lib/function';
import { join } from 'path';
import { cargoSafeMetadata } from './cargoInterop';
import { from, lastValueFrom } from 'rxjs';
import { map as mapObs, mergeMap } from 'rxjs/operators';

export type Configuration = {
  customTargetDir: Option<string>;
  docsName: Option<string>;
  docsPath: Option<string>;
  extensionPath: string;
  rustShareDocPath: Option<string>;
};

export const defaultConfig = () => ({ customTargetDir: none, docsPath: none });

export const getConfiguration = async (extensionPath: string): Promise<Option<Configuration>> => {
  const workspaces = vscode.workspace.workspaceFolders;
  const rustShareDocPath = pipe(
    fromNullable(vscode.workspace.getConfiguration().get<string | undefined>('rustDocViewer.rustShareDocPath')),
    map((docPath) => (docPath[0] === '~' ? docPath.replace('~', os.homedir()) : docPath)),
    map((docPath) => join(docPath, 'rust', 'html'))
  );
  const extraEnv = fromNullable(
    vscode.workspace.getConfiguration().get<Record<string, string>>('rustDocViewer.extraEnv')
  );
  if (workspaces && workspaces.length > 0) {
    let docsPathWs = workspaces[0];
    if (workspaces.length > 1) {
      const quickPickSelectionOpt = await showQuickPick(
        workspaces.map((ws) => ws.name),
        { placeHolder: 'Select workspace to display' }
      );
      if (quickPickSelectionOpt) {
        docsPathWs = workspaces.find((ws) => ws.name === quickPickSelectionOpt)!;
      }
    }

    let docsPath: Option<string> = none;
    let docsName: Option<string> = none;
    const docsInfo = await getDocsInfo(docsPathWs, extraEnv);
    if (isSome(docsInfo)) {
      const { docsPaths, names } = docsInfo.value;
      let name: string | undefined = names[0];
      if (names.length > 1) {
        name = await showQuickPick(names, { placeHolder: 'Select crate to display' });
      }
      if (name) {
        docsName = some(name);
        for (let docPath of docsPaths) {
          // cargo doc outputs docs in a folder using '_' when the name may be '-', so check both
          const pathCand = path.join(docPath, name);
          const pathCand2 = path.join(docPath, name.replace(/-/g, '_'));
          if (existsSync(pathCand)) {
            docsPath = some(pathCand);
          } else if (existsSync(pathCand2)) {
            docsPath = some(pathCand2);
          }
        }
      }
    }

    return some({
      customTargetDir: none,
      docsName,
      docsPath,
      extensionPath,
      rustShareDocPath,
    });
  }

  return none;
};

// only a (very) partial impl of a valid Cargo.toml, expand if needed
type CrateType = {
  bin?: { name: string };
  lib?: { name: string };
  package?: { name: string };
  workspace?: { members: string[] }[];
};
const getDocsInfo = async (
  base: vscode.WorkspaceFolder,
  extraEnv: Option<Record<string, string>>
): Promise<Option<{ names: string[]; docsPaths: string[] }>> => {
  const envConfig = isSome(extraEnv) ? extraEnv.value : undefined;
  return lastValueFrom(
    cargoSafeMetadata({ cwd: base.uri.fsPath, envConfig }).pipe(
      mapObs((metadata) => {
        return pipe(
          metadata,
          map((metadata) => {
            const names =
              metadata?.packages?.reduce(
                (nam, pkg) => [...nam, ...pkg.targets.map((target) => target.name)],
                [] as string[]
              ) || [];
            return {
              names,
              docsPaths: [join(metadata.target_directory, 'doc')],
            };
          })
        );
      }),
      mergeMap((docsInfo) => {
        if (isSome(docsInfo)) {
          return from([docsInfo]);
        } else {
          return from(directorySearchStrategy(base));
        }
      })
    )
  );
};

const directorySearchStrategy = async (base: vscode.WorkspaceFolder) => {
  const docsInfo = await bfsDir(base.uri.fsPath, (dir) => dir.name === 'Cargo.toml' || dir.name === 'doc').then(
    (dirs) => {
      return dirs.reduce(async (acc, path) => {
        if (path.includes('Cargo')) {
          try {
            const fileData = await readFile(path, 'utf-8');
            const crate: CrateType = parse(fileData);
            if (crate.bin?.name) {
              acc.then((data) => {
                data.names.push(crate.bin!.name);
              });
            }

            if (crate.lib?.name) {
              acc.then((data) => {
                data.names.push(crate.lib!.name);
              });
            }

            if (crate.package?.name) {
              acc.then((data) => {
                data.names.push(crate.package!.name);
              });
            }
          } catch (e: any) {
            showError(`toml parse error in ${path}, error: ${e.message}`);
          }
        } else {
          acc.then((data) => {
            data.docsPaths.push(path);
            return data;
          });
        }
        return acc;
      }, Promise.resolve({ names: [] as string[], docsPaths: [] as string[] }));
    }
  );
  return some(docsInfo);
};

const bfsDir = async (basePath: string, comparator: (dir: Dirent) => boolean) => {
  const paths = Queue.fromArray([basePath]);
  const accumulator = [];
  while (paths.length > 0) {
    const currPath = (Queue.dequeue(paths) as Some<string>).value;
    const dirs = await readdir(currPath, { withFileTypes: true });
    for (let dir of dirs) {
      const newPath = path.join(currPath, dir.name);
      if (comparator(dir)) {
        accumulator.push(newPath);
      } else if (dir.isDirectory()) {
        Queue.enqueue(paths, newPath);
      }
    }
  }

  return accumulator;
};

const showQuickPick = (items: string[], options: vscode.QuickPickOptions) => {
  return vscode.window.showQuickPick(items, options);
};
