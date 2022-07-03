import { shareReplay, Subscription } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { errorListener } from '../../src/doc-listener/error';
import { setError } from '../../src/utils/actions';
import { slice, StateKey, update } from '../../src/utils/state';

describe('error listener', () => {
  let cleanupSub: Subscription | null;
  let testScheduler: TestScheduler;
  
  beforeEach(() => {
    if (cleanupSub) {
      cleanupSub.unsubscribe();
      cleanupSub = null;
    }
    testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('shows error and resets queue', () => {
    testScheduler.run((helpers) => {
      const { expectObservable } = helpers;
      const error = 'test error';

      const sliceTest = slice([StateKey.errors]);
      const sliceReplace = sliceTest.pipe(shareReplay(2));
      cleanupSub = errorListener({ slice: sliceReplace });
      update(setError([error]));
      
      const expected = '(01)';
      const values = [{ errors: [error] }, { errors: [] }];
      expectObservable(sliceReplace).toBe(expected, values);
    });
  });
});
