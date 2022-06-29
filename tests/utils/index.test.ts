import { subscriptionToDisposable } from '../../src/utils';

describe('index utils', () => {
  it('should create a disposable from a subscription', () => {
    const mockSubscription = {
      unsubscribe: jest.fn(),
    };
    const disposable = subscriptionToDisposable(mockSubscription as any);
    disposable.dispose();

    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });
});
