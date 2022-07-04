import { none, some } from 'fp-ts/Option';
import { skip } from 'rxjs';

import {
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
import { PageKeyType, slice, StateKey, update } from '../../src/utils/state';

describe('state util', () => {
  describe('slice', () => {
    it('should create a slice of the complete state', (done) => {
      slice([StateKey.pageKey]).subscribe((state) => {
        const statePropertyNames = Object.keys(state);

        expect(statePropertyNames.length).toBe(1);
        done();
      });
    });
  });

  describe('update', () => {
    let stateSlice = slice([
      StateKey.configuration,
      StateKey.errors,
      StateKey.loadedPage,
      StateKey.pageKey,
      StateKey.parsedDoc,
      StateKey.rawDoc,
      StateKey.userHistory,
    ]);

    it('should process batch actions', (done) => {
      const mockConfig = some({
        customTargetDir: none,
        docsName: some('mockDocsName'),
        docsPath: some('mockDocsPath'),
        extensionPath: 'mockExtensionPath',
        rustShareDocPath: none
      });
      const mockError = ['mockError'];
      const mockPageKey = { val: some('mockPageKey'), type: PageKeyType.LocalDoc };
      const mockParsedDoc = some('mockParsedDoc');
      const mockRawDoc = some('mockRawDoc');
      const mockUserHistory = [{ docsPath: none, key: none }];
      const action = setBatch([
        setError(mockError),
        setHistoryCursor(1),
        setConfig(mockConfig),
        setPageKey(mockPageKey),
        setRawDoc(mockRawDoc),
        setParsedDoc(mockParsedDoc),
        setUserHistory(mockUserHistory),
      ]);

      const batchSub = stateSlice.pipe(skip(1)).subscribe((state) => {
        expect(state.configuration).toEqual(mockConfig);
        expect(state.errors).toEqual(mockError);
        expect(state.loadedPage).toBe(true);
        expect(state.pageKey).toEqual(mockPageKey);
        expect(state.parsedDoc).toEqual(mockParsedDoc);
        expect(state.rawDoc).toEqual(mockRawDoc);
        expect(state.userHistory).toEqual({ cursor: 0, paths: mockUserHistory });

        batchSub.unsubscribe();
        done();
      });

      update(action);
    });

    it('should process reset actions', (done) => {
      const mockConfig = some({
        customTargetDir: none,
        docsName: some('mockDocsName'),
        docsPath: some('mockDocsPath'),
        extensionPath: 'mockExtensionPath',
        rustShareDocPath: none
      });
      const mockError = ['mockError'];
      const action = setBatch([setError(mockError), setErrorReset(), setConfig(mockConfig), setReset()]);

      const resetSub = stateSlice.pipe(skip(1)).subscribe((state) => {
        expect(state.errors).toEqual([]);
        expect(state.configuration).toEqual(none);

        resetSub.unsubscribe();
        done();
      });

      update(action);
    });
  });
});
