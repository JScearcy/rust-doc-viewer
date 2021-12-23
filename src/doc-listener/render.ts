import { isSome } from 'fp-ts/lib/Option';
import { WebviewPanel } from 'vscode';
import { subscriptionToDisposable } from '../utils';
import { slice, StateKey } from '../utils/state';

export const renderListener = (view: WebviewPanel) => {
  return subscriptionToDisposable(
    slice([StateKey.parsedDoc]).subscribe(({ parsedDoc }) => {
      if (isSome(parsedDoc)) {
        view.webview.html = parsedDoc.value;
      }
    })
  );
};
