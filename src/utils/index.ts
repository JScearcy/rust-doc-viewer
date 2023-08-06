import { Subscription } from 'rxjs';
import { Uri } from 'vscode';

export const subscriptionToDisposable = (sub: Subscription) => {
  return {
    dispose: () => {
      sub.unsubscribe();
    },
  };
};

const rustLangRegex = /.*\.rust-lang\.org.*/;
export const isExternal = (path: string) => {
  if (path.includes("vscode")) {
    return false;
  }
  const uri = Uri.parse(path);

  return uri && (uri.scheme === 'http' || uri.scheme === 'https') && rustLangRegex.test(uri.authority);
};
