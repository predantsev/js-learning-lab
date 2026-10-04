// withWriteLock(fn): run the async function `fn` only after every earlier fn has finished,
// and resolve (or reject) with what `fn` gives.
let tail = Promise.resolve();

export function withWriteLock(fn) {
  const result = tail.then(() => fn());
  tail = result.catch(() => {}); // a failed fn must not block the ones after it
  return result;
}
