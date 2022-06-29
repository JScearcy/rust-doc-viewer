import { none, some } from 'fp-ts/lib/Option';
import { shareReplay, tap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Disposable } from 'vscode';
import { configListener } from '../../src/doc-listener/configuration';
import { setConfig } from '../../src/utils/actions';
import { slice, StateKey, update } from '../../src/utils/state';
import * as load from '../../src/utils/load';

describe('configuration listener', () => {
  let cleanupSub: Disposable | null;
  let testScheduler: TestScheduler;
  jest.spyOn(load, 'loadDoc');
  beforeEach(() => {
    if (cleanupSub) {
      cleanupSub.dispose();
      cleanupSub = null;
    }
    testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    jest.resetAllMocks();
  });

  it('does not call loadDoc when configuration is none', () => {
    testScheduler.run((helpers) => {
      const { expectObservable, flush } = helpers;
      let eventCount = 0;
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey]);
      const sliceReplace = sliceTest.pipe(tap(() => eventCount++), shareReplay(2));
      cleanupSub = configListener({ slice: sliceReplace });
      
      const expected = '0';
      const values = [{ configuration: none, pageKey: 'index.html' }];
      expectObservable(sliceReplace).toBe(expected, values);

      flush();

      expect(eventCount).toBe(1);
    });
  });

  it('does not set when configuration is none', () => {
    testScheduler.run((helpers) => {
      const { expectObservable, flush } = helpers;
      let eventCount = 0;
      const config = {
        customTargetDir: none,
        docsName: none,
        docsPath: some('test/target'),
        extensionPath: '',
      };
      const sliceTest = slice([StateKey.configuration, StateKey.pageKey]);
      const sliceReplace = sliceTest.pipe(tap(() => eventCount++), shareReplay(2));
      cleanupSub = configListener({ slice: sliceReplace });
      update(setConfig(some(config)));

      const expected = '(01)';
      const values = [{ configuration: none, pageKey: 'index.html' }, { configuration: some(config), pageKey: 'index.html' }];
      expectObservable(sliceReplace).toBe(expected, values);

      flush();

      expect(eventCount).toBe(2);
      expect(load.loadDoc).toHaveBeenCalledWith('test/target', 'index.html');
    });
  });
});
