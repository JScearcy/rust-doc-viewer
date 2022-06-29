import { State, StateKey, update } from '../utils/state';
import { subscriptionToDisposable } from '../utils';
import { setErrorReset } from '../utils/actions';
import { showError } from '../utils/error';
import { ListenerOpts } from './listener';

export const errorListener = ({ slice }: ListenerOpts<Pick<State, StateKey.errors>>) => {
  return subscriptionToDisposable(
    slice
      .subscribe(({ errors }) => {
        if (errors.length > 0) {
          errors.map((err) => showError(err));
          update(setErrorReset());
        }
      })
  );
};
