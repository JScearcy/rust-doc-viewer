import { isNone, isSome } from 'fp-ts/lib/Option';
import { dequeue, enqueue, fromArray } from '../../src/utils/queue';

describe('queue', () => {

  it('operates on a queue', () => {
    const queue = fromArray([] as number[]);
    const enqueueVal = 1;
    enqueue(queue, enqueueVal);
    enqueue(queue, enqueueVal + 1);

    expect(queue.length).toBe(2);

    const item1 = dequeue(queue);
    const item2 = dequeue(queue);
    const item3 = dequeue(queue);

    const item1Val = isSome(item1) ? item1.value : null;
    const item2Val = isSome(item2) ? item2.value : null;

    expect(item1Val).toBe(enqueueVal);
    expect(item2Val).toBe(enqueueVal + 1);
    expect(isNone(item3)).toBeTruthy();
  });
});
