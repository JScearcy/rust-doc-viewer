import { distinctUntilChanged } from 'rxjs';
import { slice, StateKey, update } from '../utils/state';
import { isEqual } from 'lodash';
import { subscriptionToDisposable } from '../utils';
import { setErrorReset } from '../utils/actions';
import * as vscode from 'vscode';

export const errorListener = () => {
  return subscriptionToDisposable(
    slice([StateKey.errors])
      .pipe(distinctUntilChanged((a, b) => isEqual(a, b)))
      .subscribe(({ errors }) => {
        errors.map((err) => vscode.window.showErrorMessage(err));
        update(setErrorReset());
      })
  );
};
