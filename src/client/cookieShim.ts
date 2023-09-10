import { CommandKey } from './command';

interface WindowExtensions {
  usableLocalStorage: () => boolean;
}

export const initCookieShim: (arg: any) => WindowExtensions = (vscode: any) => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (name: string) => {
        const state = vscode.getState();
        return state && state[name];
      },
      setItem: (name: string, value: string) => {
        const state = vscode.getState();
        const newState = { ...state, [name]: value };
        vscode.setState(newState);
        vscode.postMessage({
          commandType: CommandKey.setState,
          payload: state,
        });
      },
    },
    writable: true,
  });

  return Object.assign(window, {
    usableLocalStorage: () => true,
  });
};
