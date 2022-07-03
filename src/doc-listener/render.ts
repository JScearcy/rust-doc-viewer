import { isSome } from 'fp-ts/lib/Option';
import { WebviewPanel } from 'vscode';
import { State, StateKey } from '../utils/state';
import { ListenerOpts } from './listener';

type PostMessageListenerOpts = ListenerOpts<Pick<State, StateKey.parsedDoc>> & { view: WebviewPanel };

export const renderListener = ({ slice, view }: PostMessageListenerOpts) =>
  slice.subscribe(({ parsedDoc }) => {
    if (isSome(parsedDoc)) {
      view.webview.html = parsedDoc.value;
    }
  });
