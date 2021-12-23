import { CommandKey } from './command';

declare var currentTheme: any;
declare var mainTheme: any;
declare var switchTheme: any;

interface WindowExtensions {
  usableLocalStorage: () => boolean;
  updateLocalStorage: (name: string, value: string) => void;
  getCurrentValue: (name: string) => string;
}

export const initCookieShim: (arg: any) => WindowExtensions = (vscode: any) =>
  Object.assign(window, {
    usableLocalStorage: () => true,
    updateLocalStorage: (name: string, value: any) => {
      const state = { [name]: value };
      vscode.setState(state);
      vscode.postMessage({
        commandType: CommandKey.setState,
        payload: state,
      });
    },
    getCurrentValue: (name: string) => {
      const state = vscode.getState();
      return (state && state[name]) || 'light';
    },
  });

export const set = (newState: { 'rustdoc-theme': string }) => {
  (window as any).updateLocalStorage('rustdoc-theme', newState['rustdoc-theme']);
};

export const switchThemeHelper = () => {
  switchTheme(currentTheme, mainTheme, (window as any).getCurrentValue('rustdoc-theme'));
};
