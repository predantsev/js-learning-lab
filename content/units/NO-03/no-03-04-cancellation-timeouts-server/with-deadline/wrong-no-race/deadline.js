// Run `work(workSignal)` with a deadline of `ms` milliseconds.
// - workSignal is aborted when the deadline passes or when `signal` (the caller's) is aborted;
// - at the deadline the returned promise rejects with an error named "TimeoutError",
//   even if the work ignores its signal;
// - when the work settles first, the returned promise settles the same way and no timer is left.
export function withDeadline(ms, signal, work) {
  const controller = new AbortController();
  const onCallerAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onCallerAbort();
  else signal.addEventListener('abort', onCallerAbort, { once: true });

  let timer;
  const deadline = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new DOMException(`no result within ${ms} ms`, 'TimeoutError');
      controller.abort(error);
    }, ms);
  });

  return work(controller.signal).finally(() => {
    clearTimeout(timer);
    signal.removeEventListener('abort', onCallerAbort);
  });
}
