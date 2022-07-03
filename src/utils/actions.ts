import { none, Option } from 'fp-ts/Option';
import { Configuration } from '../configuration';
import { PageKey } from './state';

export enum ActionType {
  Batch,
  PushError,
  Reset,
  SetConfig,
  SetHistoryCursor,
  SetPageKey,
  SetParsedDoc,
  SetRawDoc,
  ResetError,
  SetUserHistory,
}

export type Action<T> = {
  payload: T;
  actionType: ActionType;
};

export type HistoryEntry = {
  docsPath: Option<string>;
  key: Option<string>;
};

export const setBatch = <T>(actions: T[]) => {
  return { actionType: ActionType.Batch, payload: actions };
};

export const setError = (err: string[]): Action<string[]> => {
  return { actionType: ActionType.PushError, payload: err };
};

export const setErrorReset = (): Action<null> => {
  return { actionType: ActionType.ResetError, payload: null };
};

export const setHistoryCursor = (cursor: number) => {
  return { actionType: ActionType.SetHistoryCursor, payload: cursor };
};

export const setReset = (): Action<Option<string>> => {
  return { actionType: ActionType.Reset, payload: none };
};

export const setConfig = (configuration: Option<Configuration>): Action<Option<Configuration>> => {
  return { actionType: ActionType.SetConfig, payload: configuration };
};

export const setPageKey = (pageKey: PageKey): Action<PageKey> => {
  return { actionType: ActionType.SetPageKey, payload: pageKey };
};

export const setParsedDoc = (doc: Option<string>): Action<Option<string>> => {
  return { actionType: ActionType.SetParsedDoc, payload: doc };
};

export const setRawDoc = (doc: Option<string>): Action<Option<string>> => {
  return { actionType: ActionType.SetRawDoc, payload: doc };
};

export const setUserHistory = (history: HistoryEntry[]) => {
  return { actionType: ActionType.SetUserHistory, payload: history };
};
