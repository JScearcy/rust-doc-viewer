import { State, StateKey, update } from '../utils/state';
import { setErrorReset } from '../utils/actions';
import { showError } from '../utils/error';
import { ListenerOpts } from './listener';

export const errorListener = ({ slice }: ListenerOpts<Pick<State, StateKey.errors>>) =>
  slice.subscribe(({ errors }) => {
    if (errors.length > 0) {
      errors.map((err) => showError(err));
      update(setErrorReset());
    }
  });
