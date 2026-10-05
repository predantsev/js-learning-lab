// Another valid shape: an explicit array of waiting jobs, started one by one.
const waiting = [];
let busy = false;

function next() {
  if (busy || waiting.length === 0) return;
  busy = true;
  const { fn, resolve, reject } = waiting.shift();
  Promise.resolve()
    .then(fn)
    .then(resolve, reject)
    .finally(() => {
      busy = false;
      next();
    });
}

export function withWriteLock(fn) {
  return new Promise((resolve, reject) => {
    waiting.push({ fn, resolve, reject });
    next();
  });
}
