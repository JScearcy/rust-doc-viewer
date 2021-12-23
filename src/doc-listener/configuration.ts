import { isSome, map } from 'fp-ts/Option';
import { distinctUntilChanged } from 'rxjs';
import { slice, StateKey } from '../utils/state';
import { loadDoc } from '../utils/load';
import { isEqual } from 'lodash';
import { pipe } from 'fp-ts/lib/function';
import { subscriptionToDisposable } from '../utils';

export const configListener = () => {
  return subscriptionToDisposable(
    slice([StateKey.configuration, StateKey.pageKey])
      .pipe(distinctUntilChanged((a, b) => isEqual(a.pageKey, b.pageKey) && isEqual(a.configuration, b.configuration)))
      .subscribe((currState) => {
        if (isSome(currState.configuration)) {
          pipe(
            currState.configuration.value.docsPath,
            map((docsPath) => loadDoc(docsPath, currState.pageKey))
          );
        }
      })
  );
};
