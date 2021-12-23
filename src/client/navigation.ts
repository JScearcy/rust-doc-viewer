import { WebviewApi } from 'vscode-webview';
import { CommandKey } from './command';

export enum HistoryAction {
  Back = 'Back',
  Forward = 'Forward',
}

export const navigatePanel = (vscode: WebviewApi<any>) => {
  const historyNav = document.createElement('nav');
  historyNav.classList.add('sub', 'historyNav');
  const backBtn = document.createElement('button');
  const forwardBtn = document.createElement('button');
  backBtn.innerHTML = '&larr;';
  backBtn.ariaLabel = 'Back Button';
  backBtn.classList.add('historyBtn');
  backBtn.addEventListener('click', () => {
    vscode.postMessage({
      commandType: CommandKey.changeHistory,
      payload: HistoryAction.Back,
    });
  });
  forwardBtn.innerHTML = '&rarr;';
  forwardBtn.ariaLabel = 'Forward Button';
  forwardBtn.classList.add('historyBtn');
  forwardBtn.addEventListener('click', () => {
    vscode.postMessage({
      commandType: CommandKey.changeHistory,
      payload: HistoryAction.Forward,
    });
  });
  historyNav.appendChild(backBtn);
  historyNav.appendChild(forwardBtn);
  document.body.prepend(historyNav);
};
