import { CommandKey } from './command';
import * as CookieShim from './cookieShim';
import { navigatePanel } from './navigation';
import { WebviewApi } from 'vscode-webview';
import { eventHandled, eventShouldBubble, navigateClickHandler } from './clickHandlers';

declare var acquireVsCodeApi: () => WebviewApi<any>;

const vscode = acquireVsCodeApi();

(function (vscode: any, window: any) {
  CookieShim.initCookieShim(vscode);

  document.addEventListener('click', (e) => {
    if (eventShouldBubble(e.target as Element)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (eventHandled(e.target as Element)) {
      return false;
    }
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

  // once DOMContentLoaded set saved state and dispatch `pageshow` event in order to trigger theme sync
  const contentLoaded = () => {
    const stateEl = document.getElementById('doc-viewer-state');
    if (stateEl) {
      const data = stateEl.getAttribute('data-state') || '{}';
      vscode.setState(JSON.parse(data));
      const event = new PageTransitionEvent('pageshow', { persisted: true });
      window.dispatchEvent(event);
    }
    document.removeEventListener('DOMContentLoaded', contentLoaded);
  };

  document.addEventListener('DOMContentLoaded', contentLoaded);
})(vscode, window);
