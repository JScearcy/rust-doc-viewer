import * as vscode from 'vscode';
import { getConfiguration } from './configuration';
import { update } from './utils/state';
import { processListener } from './doc-listener/process';
import { renderListener } from './doc-listener/render';
import { setBatch, setConfig, setReset, setUserHistory } from './utils/actions';
import { postMessageListener } from './doc-listener/postMessage';
import { configListener } from './doc-listener/configuration';
import { isNone, isSome, none, Option, some } from 'fp-ts/Option';
import { errorListener } from './doc-listener/error';

export function activate(context: vscode.ExtensionContext) {
  console.log('"rust-doc-viewer" is now active');
  let viewRef: Option<vscode.WebviewPanel> = none;
  const disposable = vscode.commands.registerCommand('extension.rustDocViewer', async () => {
    const errorSub = errorListener();
    const initConfig = await getConfiguration(context.extensionPath);
    if (isNone(viewRef)) {
      viewRef = some(
        vscode.window.createWebviewPanel(
          'rustDocViewer',
          isSome(initConfig) && isSome(initConfig.value.docsName) ? initConfig.value.docsName.value : 'docs',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
          }
        )
      );
    }
    if (isSome(viewRef)) {
      const configSub = configListener();
      const processSub = processListener(viewRef.value);
      const renderSub = renderListener(viewRef.value);
      const postMessageSub = postMessageListener(viewRef.value, context.workspaceState);
      const userHistory = [];
      if (isSome(initConfig)) {
        userHistory.push({ docsPath: initConfig.value.docsPath, key: some('index.html') });
      }
      update(setBatch([setConfig(initConfig), setUserHistory(userHistory)]));
      viewRef.value.onDidDispose(() => {
        configSub.dispose();
        errorSub.dispose();
        postMessageSub.dispose();
        processSub.dispose();
        renderSub.dispose();
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
