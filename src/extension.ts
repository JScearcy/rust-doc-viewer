import * as vscode from 'vscode';
import { join } from 'path';
import { getConfiguration } from './configuration';
import { slice, StateKey, update } from './utils/state';
import { processListener } from './doc-listener/process';
import { renderListener } from './doc-listener/render';
import { setBatch, setConfig, setReset, setUserHistory } from './utils/actions';
import { postMessageListener } from './doc-listener/postMessage';
import { configListener } from './doc-listener/configuration';
import { flatten, isNone, isSome, map, none, Option, some } from 'fp-ts/Option';
import { errorListener } from './doc-listener/error';
import { pipe } from 'fp-ts/lib/function';

export function activate(context: vscode.ExtensionContext) {
  console.log('"rust-doc-viewer" is now active');
  let viewRef: Option<vscode.WebviewPanel> = none;
  const disposable = vscode.commands.registerCommand('extension.rustDocViewer', async () => {
    const subscriptions = errorListener({ slice: slice([StateKey.errors]) });
    const initConfig = await getConfiguration(context.extensionPath);
    if (isNone(viewRef)) {
      const webViewOptions = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(context.extensionPath),
        ] as vscode.Uri[],
      };
      pipe(
        initConfig,
        map((cfg) => cfg.rustShareDocPath),
        flatten,
        map((path) => {
          webViewOptions.localResourceRoots.push(vscode.Uri.file(join(path, '../../')));
        })
      );

      pipe(
        initConfig,
        map((cfg) => cfg.docsPath),
        flatten,
        map((path) => {
          webViewOptions.localResourceRoots.push(vscode.Uri.file(join(path, '../')));
        })
      );
      const viewRefInstance = vscode.window.createWebviewPanel(
        'rustDocViewer',
        isSome(initConfig) && isSome(initConfig.value.docsName) ? initConfig.value.docsName.value : 'docs',
        vscode.ViewColumn.One,
        webViewOptions
      );
      viewRef = some(viewRefInstance);
    }

    if (isSome(viewRef)) {
      subscriptions.add(configListener({ slice: slice([StateKey.configuration, StateKey.pageKey]) }));
      subscriptions.add(
        processListener({
          slice: slice([StateKey.configuration, StateKey.pageKey, StateKey.parsedDoc, StateKey.rawDoc]),
          view: viewRef.value,
          workspaceState: context.workspaceState,
        })
      );
      subscriptions.add(renderListener({ slice: slice([StateKey.parsedDoc]), view: viewRef.value }));
      subscriptions.add(
        postMessageListener({
          slice: slice([StateKey.configuration, StateKey.userHistory]),
          view: viewRef.value,
          workspaceState: context.workspaceState,
        })
      );
      const userHistory = [];
      if (isSome(initConfig)) {
        userHistory.push({ docsPath: initConfig.value.docsPath, key: some('index.html') });
      }
      update(setBatch([setConfig(initConfig), setUserHistory(userHistory)]));
      viewRef.value.onDidDispose(() => {
        subscriptions.unsubscribe();
        viewRef = none;
        update(setReset());
      });
      if (!viewRef.value.visible) {
        viewRef.value.reveal();
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
