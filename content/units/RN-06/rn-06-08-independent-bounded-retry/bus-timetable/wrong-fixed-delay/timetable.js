// Wrong on purpose: the pause between attempts never grows, so a struggling server gets
// the retries of every client at the same steady pace.

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimetable(body) {
  return (
    Array.isArray(body) &&
    body.every(
      (d) =>
        d !== null &&
        typeof d === 'object' &&
        typeof d.id === 'string' &&
        typeof d.route === 'string' &&
        typeof d.destination === 'string' &&
        d.destination.trim() !== '' &&
        typeof d.departs === 'string' &&
        TIME.test(d.departs),
    )
  );
}

const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function loadTimetable(url, { fetchFn, timeoutMs = 3000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  let failure = 'offline';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw abortError();
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forward = () => controller.abort();
    signal?.addEventListener('abort', forward);
    try {
      const response = await fetchFn(url, { signal: controller.signal });
      if (response.status >= 500) {
        failure = 'server';
      } else if (!response.ok) {
        return { status: 'rejected', httpStatus: response.status };
      } else {
        let body;
        try {
          body = await response.json();
        } catch {
          return { status: 'invalid' };
        }
        return isValidTimetable(body) ? { status: 'fresh', departures: body } : { status: 'invalid' };
      }
    } catch (error) {
      if (signal?.aborted) throw abortError();
      failure = timedOut ? 'timeout' : 'offline';
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forward);
    }
    if (attempt < maxAttempts) await wait(baseDelayMs, signal); // the same pause every time
  }
  return { status: failure };
}
