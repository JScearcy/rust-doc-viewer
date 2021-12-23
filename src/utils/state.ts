import { Option, none } from 'fp-ts/Option';
import { isEqual } from 'lodash';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';

import { Configuration } from '../configuration';

import { Action, ActionType } from './actions';

const getInitialState = (): State => ({
  configuration: none,
  errors: [],
  loadedPage: false,
  pageKey: 'index.html',
  parsedDoc: none,
  rawDoc: none,
  userHistory: {
    paths: [],
    cursor: 0,
  },
});

const stateSubject = new BehaviorSubject<State>(getInitialState());

const updateInternal = <T>(state: State, { payload, actionType }: Action<T>) => {
  switch (actionType) {
    case ActionType.Batch: {
      const newState = (payload as any).reduce(
        (stateAcc: State, currAct: Action<unknown>) => updateInternal(stateAcc, currAct),
        state
      );
      return newState;
    }
    case ActionType.PushError: {
      const newErrors = payload as any;
      return { ...state, errors: [...state.errors, ...newErrors] };
    }
    case ActionType.ResetError: {
      return { ...state, errors: [] };
    }
    case ActionType.Reset: {
      return getInitialState();
    }
    case ActionType.SetConfig: {
      const configuration = payload as any;
      return { ...state, configuration };
    }
    case ActionType.SetHistoryCursor: {
      return { ...state, userHistory: { paths: state.userHistory.paths, cursor: payload } };
    }
    case ActionType.SetPageKey: {
      return { ...state, pageKey: (payload as any).value };
    }
    case ActionType.SetParsedDoc: {
      return { ...state, parsedDoc: payload as any };
    }
    case ActionType.SetRawDoc: {
      const rawDoc = payload as any;
      return { ...state, loadedPage: true, parsedDoc: none, rawDoc };
    }
    case ActionType.SetUserHistory: {
      const currCursor = state.userHistory.cursor;
      const newHistory = [...state.userHistory.paths.slice(0, currCursor + 1), ...(payload as any)];

      return {
        ...state,
        userHistory: {
          paths: newHistory,
          cursor: newHistory.length - 1,
        },
      };
    }
  }
};

export enum StateKey {
  configuration = 'configuration',
  errors = 'errors',
  loadedPage = 'loadedPage',
  pageKey = 'pageKey',
  parsedDoc = 'parsedDoc',
  rawDoc = 'rawDoc',
  userHistory = 'userHistory',
}

export type State = {
  [StateKey.configuration]: Option<Configuration>;
  [StateKey.errors]: string[];
  [StateKey.loadedPage]: boolean;
  [StateKey.pageKey]: string;
  [StateKey.parsedDoc]: Option<string>;
  [StateKey.rawDoc]: Option<string>;
  [StateKey.userHistory]: {
    paths: { docsPath: Option<string>; key: Option<string> }[];
    cursor: number;
  };
};

export const update = <T>(action: Action<T>) => {
  const state = stateSubject.getValue();
  const newState = updateInternal(state, action);
  if (newState) {
    stateSubject.next(newState);
  }
};

// this will be take a list of top level selectors until something else is needed
export const slice = <T extends StateKey>(selectors: T[]) =>
  new Observable<Pick<State, T>>((sub) => {
    stateSubject
      .pipe(
        map((state) => {
          return selectors.reduce((newState, key) => {
            newState[key] = state[key];
            return newState;
          }, {} as Pick<State, T>);
        }),
        distinctUntilChanged(isEqual)
      )
      .subscribe(sub);
  });
