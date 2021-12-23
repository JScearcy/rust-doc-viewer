import { alt, isSome, none, Option, some } from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { sep } from 'path';
import { combineLatest, distinctUntilChanged, Observable } from 'rxjs';
import { Disposable, Memento, WebviewPanel } from 'vscode';
import { Command, CommandKey } from '../client/command';
import { setBatch, setConfig, setHistoryCursor, setPageKey, setUserHistory } from '../utils/actions';
import { slice, StateKey, update } from '../utils/state';
import { isEqual } from 'lodash';
import { URL } from 'url';
import { existsSync } from 'fs';
import { HistoryAction } from '../client/navigation';

export const postMessageListener = (view: WebviewPanel, workspaceState: Memento) => {
  const disposables: Disposable[] = [];
  const messageObservable = new Observable<Command>((sub) => {
    view.webview.onDidReceiveMessage((e: Command) => sub.next(e), null, disposables);
  });
  const subscription = combineLatest([slice([StateKey.configuration, StateKey.userHistory]), messageObservable])
    .pipe(distinctUntilChanged((a, b) => isEqual(a[1], b[1])))
    .subscribe(([exState, command]) => {
      const { configuration, userHistory } = exState;
      const { commandType, payload } = command;
      switch (commandType) {
        case CommandKey.newPage: {
          if (payload.path && isSome(configuration) && isSome(configuration.value.docsPath)) {
            const [docsPathCand, key] = getNewPathData(payload.path);
            const docsPath = pipe(
              docsPathCand,
              alt(() => configuration.value.docsPath)
            );
            const newConfig = { ...configuration.value, docsPath };
            update(setBatch([setConfig(some(newConfig)), setPageKey(key), setUserHistory([{ docsPath, key }])]));
          }
          break;
        }
        case CommandKey.setState: {
          if (payload) {
            const currState = JSON.parse(workspaceState.get('rustDocViewer', '{}'));
            workspaceState.update(
              'rustDocViewer',
              JSON.stringify({
                ...currState,
                ...payload,
              })
            );
          }
          break;
        }
        case CommandKey.getState: {
          let state: string = workspaceState.get('rustDocViewer', '{}');
          view.webview.postMessage({
            commandType: CommandKey.getState.toString(),
            payload: state,
          });
          break;
        }
        case CommandKey.changeHistory: {
          if (isSome(configuration)) {
            let cursor = payload === HistoryAction.Back ? userHistory.cursor - 1 : userHistory.cursor + 1;
            if (
              (payload === HistoryAction.Back && cursor >= 0) ||
              (payload === HistoryAction.Forward && cursor < userHistory.paths.length)
            ) {
              const { docsPath, key } = userHistory.paths[cursor];
              const newConfig = { ...configuration.value, docsPath };
              update(setBatch([setConfig(some(newConfig)), setPageKey(key), setHistoryCursor(cursor)]));
            }
          }
          break;
        }
      }
    });
  const dispose = () => {
    disposables.forEach((dis) => dis.dispose());
    subscription.unsubscribe();
  };

  return {
    dispose,
  };
};

const getNewPathData = (path: string): Option<string>[] => {
  const pieces = new URL(path).pathname.split(sep);
  const key = pieces.splice(-1).join(sep);
  const configPathCandidate = pieces.join(sep);
  // TODO: use async exists
  if (!existsSync(configPathCandidate)) {
    return [none, some(key)];
  }
  return [some(configPathCandidate), some(key)];
};
