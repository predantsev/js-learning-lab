// A request with a timeout and a bounded retry. React Native 0.86 has no AbortSignal.timeout(), so every
// attempt gets its own AbortController and a timer that aborts it. An answer below 500 is final (a
// 404 does not get better by asking again); a 5xx answer, a network failure or a timeout is tried
// again, at most maxAttempts times in all, with a pause that doubles: baseDelayMs, 2 × baseDelayMs, …
// When the caller's signal aborts — the screen lost the focus — everything stops with an AbortError.
// No React Native here: Node.js runs the same function against the real mock service in the tests.

export type HttpResponse = { status: number; ok: boolean; json(): Promise<unknown> };
export type FetchFn = (url: string, init: { signal: AbortSignal }) => Promise<HttpResponse>;

export type RetryOptions = {
  fetchFn: FetchFn;
  timeoutMs?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
};

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

// Waits ms milliseconds, or rejects with an AbortError as soon as the signal aborts.
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(namedError("AbortError", "The request was cancelled"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(namedError("AbortError", "The request was cancelled"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort);
  });
}

export async function fetchWithRetry(url: string, options: RetryOptions): Promise<HttpResponse> {
  const { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = options;
  for (let attempt = 1; ; attempt += 1) {
    if (signal?.aborted) {
      throw namedError("AbortError", "The request was cancelled");
    }
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      const response = await fetchFn(url, { signal: controller.signal });
      if (response.status < 500 || attempt >= maxAttempts) {
        return response;
      }
    } catch (error) {
      if (signal?.aborted) {
        throw namedError("AbortError", "The request was cancelled");
      }
      if (attempt >= maxAttempts) {
        throw timedOut ? namedError("TimeoutError", "No answer within " + timeoutMs + " ms") : error;
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
    await wait(baseDelayMs * 2 ** (attempt - 1), signal);
  }
}
