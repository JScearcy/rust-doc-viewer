import { Command, CommandKey } from './command';
import * as CookieShim from './cookieShim';
import { navigatePanel } from './navigation';
import { WebviewApi } from 'vscode-webview';
import { eventShouldBubble, navigateClickHandler } from './clickHandlers';

declare var acquireVsCodeApi: () => WebviewApi<any>;

const vscode = acquireVsCodeApi();

(function (vscode: any, window: any) {
  CookieShim.initCookieShim(vscode);
  window.addEventListener('message', (e: MessageEvent<Command>) => {
    const message = e.data;
    if (message.commandType === CommandKey.getState.toString()) {
      const state = JSON.parse(message.payload);
      CookieShim.set(state);
      CookieShim.switchThemeHelper();
    } else {
      console.log('unknown Command: ', message);
    }
  });

  document.addEventListener('click', (e) => {
    if (eventShouldBubble(e.target as Element)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const element = e.target as HTMLElement;
    const message = navigateClickHandler(element);
    if (message?.commandType === CommandKey.navigateAnchor) {
      const id = message.payload.id;
      const elToScrollTo = document.getElementById(id);
      if (elToScrollTo) {
        elToScrollTo.scrollIntoView();
      } else {
        message.commandType = CommandKey.newPage;
        vscode.postMessage(message);
      }
    } else if (message) {
      vscode.postMessage(message);
    }

    return false;
  });

  vscode.postMessage({
    commandType: CommandKey.getState,
  });

  navigatePanel(vscode);
})(vscode, window);
