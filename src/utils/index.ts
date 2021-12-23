import { Subscription } from 'rxjs';

export const subscriptionToDisposable = (sub: Subscription) => {
  return {
    dispose: () => {
      sub.unsubscribe();
    },
  };
};
