import { isSome, map, sequenceArray } from 'fp-ts/Option';
import { State, StateKey } from '../utils/state';
import { loadDoc } from '../utils/load';
import { pipe } from 'fp-ts/lib/function';
import { ListenerOpts } from './listener';

export const configListener = ({ slice }: ListenerOpts<Pick<State, StateKey.configuration | StateKey.pageKey>>) =>
  slice.subscribe(({ configuration, pageKey }) => {
    if (isSome(configuration)) {
      pipe(
        sequenceArray([configuration.value.docsPath, pageKey.val]),
        map(([docsPath, pageKeyVal]) => loadDoc(docsPath, pageKeyVal))
      );
    }
  });
