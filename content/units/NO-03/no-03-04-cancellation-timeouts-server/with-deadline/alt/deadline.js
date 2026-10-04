// Run `work(workSignal)` with a deadline of `ms` milliseconds.
// - workSignal is aborted when the deadline passes or when `signal` (the caller's) is aborted;
// - at the deadline the returned promise rejects with an error named "TimeoutError",
//   even if the work ignores its signal;
// - when the work settles first, the returned promise settles the same way and no timer is left.
export function withDeadline(ms, signal, work) {
  const workSignal = AbortSignal.any([signal, AbortSignal.timeout(ms)]);
  return new Promise((resolve, reject) => {
    workSignal.addEventListener('abort', () => reject(workSignal.reason), { once: true });
    work(workSignal).then(resolve, reject);
  });
}
