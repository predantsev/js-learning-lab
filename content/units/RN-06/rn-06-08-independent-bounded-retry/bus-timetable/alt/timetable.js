// The bus-timetable feed, written as "one attempt → an outcome" plus a loop that decides about retries.

export function isValidTimetable(body) {
  if (!Array.isArray(body)) return false;
  for (const item of body) {
    if (typeof item !== 'object' || item === null) return false;
    const { id, route, destination, departs } = item;
    if (typeof id !== 'string' || typeof route !== 'string') return false;
    if (typeof destination !== 'string' || destination.trim().length === 0) return false;
    if (typeof departs !== 'string' || !/^\d\d:\d\d$/.test(departs)) return false;
    const [hours, minutes] = departs.split(':').map(Number);
    if (hours > 23 || minutes > 59) return false;
  }
  return true;
}

const RETRYABLE = new Set(['offline', 'timeout', 'server']);
const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

async function attemptOnce(url, fetchFn, timeoutMs, outer) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const forward = () => controller.abort();
  outer?.addEventListener('abort', forward);
  try {
    const response = await fetchFn(url, { signal: controller.signal });
    if (response.status >= 500) return { status: 'server' };
    if (response.status >= 400) return { status: 'rejected', httpStatus: response.status };
    const body = await response.json().catch(() => undefined);
    return isValidTimetable(body) ? { status: 'fresh', departures: body } : { status: 'invalid' };
  } catch {
    return { status: timedOut ? 'timeout' : 'offline' };
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', forward);
  }
}

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(abortError()); }, { once: true });
  });
}

export async function loadTimetable(url, { fetchFn, timeoutMs = 3000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  let outcome;
  let delay = baseDelayMs;
  for (let left = maxAttempts; left > 0; left -= 1) {
    if (signal?.aborted) throw abortError();
    outcome = await attemptOnce(url, fetchFn, timeoutMs, signal);
    if (signal?.aborted) throw abortError();
    if (!RETRYABLE.has(outcome.status) || left === 1) return outcome;
    await pause(delay, signal);
    delay *= 2;
  }
  return outcome;
}
