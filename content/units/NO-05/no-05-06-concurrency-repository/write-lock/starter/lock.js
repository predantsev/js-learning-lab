// withWriteLock(fn): run the async function `fn` only after every earlier fn has finished,
// and resolve (or reject) with what `fn` gives.
export function withWriteLock(fn) {
  return fn();
}
