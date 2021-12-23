import { Option, none, some } from 'fp-ts/Option';

type Queue<T> = {
  length: number;
  value: T[];
};

export const fromArray = <T>(arr: T[]): Queue<T> => {
  return {
    value: arr,
    get length() {
      return this.value.length;
    },
  };
};

export const dequeue = <T>(queue: Queue<T>): Option<T> => {
  if (queue.value.length > 0) {
    return some(queue.value.shift() as T);
  } else {
    return none;
  }
};

export const enqueue = <T>(queue: Queue<T>, el: T) => {
  queue.value.push(el);
};
