// span(): times one step of one request and logs it with that request's id.
const round = (ms) => Math.round(ms * 100) / 100;

export function span(name, requestId, log, fn) {
  const started = performance.now();
  const finish = () => log({ requestId, span: name, ms: round(performance.now() - started) });
  let result;
  try {
    result = fn();
  } finally {
    if (!(result instanceof Promise)) finish();
  }
  // An async step (a promise) is finished when it settles, not when it starts.
  return result instanceof Promise ? result.finally(finish) : result;
}
