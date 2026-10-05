// withWriteLock(fn): run the async function `fn` only after every earlier fn has finished,
// and resolve (or reject) with what `fn` gives.
// Mistake: callers get the queue's promise, which swallows the error of their fn.
let tail = Promise.resolve();

export function withWriteLock(fn) {
  tail = tail.then(() => fn()).catch(() => {});
  return tail;
}
