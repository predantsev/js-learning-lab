// One queue for the changes of one repository. Every await is a gap in which another request can read
// the same old file, so the whole read → change → write of a change runs inside the queue, one after
// another. A failed change does not block the ones after it, and its caller still gets its own error.
// The queue lives in one Node process: it does not protect a file that two processes write.
export type WriteLock = <T>(change: () => Promise<T>) => Promise<T>;

export function createWriteLock(): WriteLock {
  let tail: Promise<unknown> = Promise.resolve();
  return (change) => {
    const result = tail.then(() => change());
    tail = result.catch(() => {});
    return result;
  };
}
