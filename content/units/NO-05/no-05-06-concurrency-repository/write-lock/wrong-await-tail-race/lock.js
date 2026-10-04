// withWriteLock(fn): run the async function `fn` only after every earlier fn has finished,
// and resolve (or reject) with what `fn` gives.
// Mistake: several callers await the same `tail` and then all start at once.
let tail = Promise.resolve();

export async function withWriteLock(fn) {
  await tail;
  const result = fn();
  tail = result.catch(() => {});
  return result;
}
