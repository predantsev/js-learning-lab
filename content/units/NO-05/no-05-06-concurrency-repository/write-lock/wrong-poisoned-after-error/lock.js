// withWriteLock(fn): run the async function `fn` only after every earlier fn has finished,
// and resolve (or reject) with what `fn` gives.
// Mistake: one rejected fn rejects every fn queued after it — the lock stays broken.
let tail = Promise.resolve();

export function withWriteLock(fn) {
  const result = tail.then(() => fn());
  tail = result;
  return result;
}
