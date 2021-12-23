import { none } from 'fp-ts/Option';
import {
  ActionType,
  setBatch,
  setConfig,
  setError,
  setErrorReset,
  setHistoryCursor,
  setPageKey,
  setParsedDoc,
  setRawDoc,
  setReset,
  setUserHistory,
} from '../../src/utils/actions';

const actions = [
  { args: [[]], fn: setBatch, expected: { actionType: ActionType.Batch, payload: [] } },
  { args: [[]], fn: setError, expected: { actionType: ActionType.PushError, payload: [] } },
  { args: [[]], fn: setErrorReset, expected: { actionType: ActionType.ResetError, payload: null } },
  { args: [0], fn: setHistoryCursor, expected: { actionType: ActionType.SetHistoryCursor, payload: 0 } },
  { args: [], fn: setReset, expected: { actionType: ActionType.Reset, payload: none } },
  { args: [none], fn: setConfig, expected: { actionType: ActionType.SetConfig, payload: none } },
  { args: [none], fn: setPageKey, expected: { actionType: ActionType.SetPageKey, payload: none } },
  { args: [none], fn: setParsedDoc, expected: { actionType: ActionType.SetParsedDoc, payload: none } },
  { args: [none], fn: setRawDoc, expected: { actionType: ActionType.SetRawDoc, payload: none } },
  { args: [[]], fn: setUserHistory, expected: { actionType: ActionType.SetUserHistory, payload: [] } },
];
describe('actions util', () => {
  actions.map(({ args, fn, expected }) => {
    it(`should return expected action: ${fn.name}`, () => {
      // @ts-ignore
      const result = fn(...args);

      expect(result).toEqual(expected);
    });
  });
});
