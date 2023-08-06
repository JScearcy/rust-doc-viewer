import { alt, fromNullable, isSome, map, none, Option, some } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { basename, join, sep } from 'path';
import { combineLatest, distinctUntilChanged, Observable } from 'rxjs';
import { env, Disposable, Memento, Uri, WebviewPanel } from 'vscode';
import { Command, CommandKey } from '../client/command';
import { setBatch, setConfig, setHistoryCursor, setPageKey, setUserHistory } from '../utils/actions';
import { PageKeyType, State, StateKey, update } from '../utils/state';
import { isEqual } from 'lodash';
import { URL } from 'url';
import { existsSync } from 'fs';
import { HistoryAction } from '../client/navigation';
import { isExternal } from '../utils';
import { ListenerOpts } from './listener';

type PostMessageListenerOpts = ListenerOpts<Pick<State, StateKey.configuration | StateKey.userHistory>> & {
  view: WebviewPanel;
  workspaceState: Memento;
};

const docPathRegex = /^\/.*\/((?:std|core)\/.*)/;
export const postMessageListener = ({ slice, view, workspaceState }: PostMessageListenerOpts) => {
  const disposables: Disposable[] = [];
  const messageObservable = new Observable<Command>((sub) => {
    view.webview.onDidReceiveMessage((e: Command) => sub.next(e), null, disposables);
  });
  return combineLatest([slice, messageObservable])
    .pipe(distinctUntilChanged((a, b) => isEqual(a[1], b[1])))
    .subscribe(([exState, command]) => {
      const { configuration, userHistory } = exState;
      const { commandType, payload } = command;
      switch (commandType) {
        case CommandKey.newPage: {
          if (isExternal(payload.path)) {
            const externalUri = Uri.parse(payload.path);
            if (isSome(configuration) && isSome(configuration.value.rustShareDocPath)) {
              const docKeyMatch = externalUri.path.match(docPathRegex);
              if (docKeyMatch) {
                const docMatch = docKeyMatch[1];
                const fileName = basename(docKeyMatch[1]);
                const filePath = docMatch.replace(fileName, '');
                const docsPath = pipe(
                  configuration.value.rustShareDocPath,
                  map((rustPath) => join(rustPath, filePath))
                );
                const newConfig = { ...configuration.value, docsPath };
                const key = fromNullable(fileName);
                update(
                  setBatch([
                    setConfig(some(newConfig)),
                    setPageKey({ val: key, type: PageKeyType.StdDoc }),
                    setUserHistory([{ docsPath, key }]),
                  ])
                );
                break;
              }
            }
            env.openExternal(externalUri);
          } else if (payload.path && isSome(configuration) && isSome(configuration.value.docsPath)) {
            const [docsPathCand, key] = getNewPathData(payload.path);
            const docsPath = pipe(
              docsPathCand,
              alt(() => configuration.value.docsPath)
            );
            const newConfig = { ...configuration.value, docsPath };
            update(
              setBatch([
                setConfig(some(newConfig)),
                setPageKey({ val: key, type: PageKeyType.LocalDoc }),
                setUserHistory([{ docsPath, key }]),
              ])
            );
          }
          break;
        }
        case CommandKey.setState: {
          if (payload) {
            const currState = JSON.parse(workspaceState.get('rustDocViewer', '{}'));
            const newState = {
              ...currState,
              ...payload,
            };
            workspaceState.update(
              'rustDocViewer',
              JSON.stringify(newState)
            );
          }
          break;
        }
        case CommandKey.getState: {
          let stateRaw: string = workspaceState.get('rustDocViewer', '{}');
          let state = JSON.parse(stateRaw);
          view.webview.postMessage({
            commandType: CommandKey.getState.toString(),
            payload: JSON.stringify(state),
          });
          break;
        }
        case CommandKey.changeHistory: {
          if (isSome(configuration)) {
            let cursor = payload === HistoryAction.Back ? userHistory.cursor - 1 : userHistory.cursor + 1;
            if (
              (payload === HistoryAction.Back && cursor >= 0) ||
              (payload === HistoryAction.Forward && cursor < userHistory.paths.length)
            ) {
              const { docsPath, key } = userHistory.paths[cursor];
              const newConfig = { ...configuration.value, docsPath };
              update(setBatch([setConfig(some(newConfig)), setPageKey(key), setHistoryCursor(cursor)]));
            }
          }
          break;
        }
      }
    });
};

const getNewPathData = (path: string): Option<string>[] => {
  const pieces = new URL(path).pathname.split('/');
  const key = pieces.splice(-1).join(sep);
  const configPathCandidate = pieces.filter((piece) => piece.length > 0).join(sep);
  // TODO: use async exists
  // handling base path case for *nix environment
  if (existsSync(`${sep}${configPathCandidate}`)) {
    return [some(`${sep}${configPathCandidate}`), some(key)];
  }
  // handling base path case for relative + Windows environment
  if (existsSync(configPathCandidate)) {
    return [some(configPathCandidate), some(key)];
  }
  return [none, some(key)];
};
