import { isSome, map, sequenceArray, Some } from 'fp-ts/Option';
import { PageKeyType, State, StateKey } from '../utils/state';
import { loadDoc } from '../utils/load';
import { pipe } from 'fp-ts/lib/function';
import { ListenerOpts } from './listener';

export const configListener = ({ slice }: ListenerOpts<Pick<State, StateKey.configuration | StateKey.pageKey>>) =>
  slice.subscribe(({ configuration, pageKey }) => {
    if (isSome(configuration)) {
      pipe(
        sequenceArray([configuration.value.docsPath, pageKey.val]),
        map(
          ([docsPath, pageKeyVal]) => pageKey.type === PageKeyType.LocalDoc
            ? loadDoc(docsPath, pageKeyVal)
            : loadDoc((configuration.value.rustStdPath as Some<string>).value, pageKeyVal)
        )
      );
    }
  });
