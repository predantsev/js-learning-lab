// A bounded job queue and retries. The queue runs at most `concurrency` jobs at once and keeps at most
// `maxQueued` waiting; one more is refused at once with QueueFull (the server answers 503 with
// Retry-After) — saying "not now" quickly beats failing slowly for everyone. retry() repeats only what can
// pass on a second try, with an exponential pause and jitter, and stops at once when the signal aborts.
export class QueueFull extends Error {
  constructor() {
    super("the job queue is full");
    this.name = "QueueFull";
  }
}

export type JobQueue = {
  add<T>(job: () => Promise<T>): Promise<T>;
  stats(): { running: number; waiting: number };
};

export function createJobQueue({ concurrency, maxQueued }: { concurrency: number; maxQueued: number }): JobQueue {
  type Entry = { job: () => Promise<unknown>; resolve: (value: unknown) => void; reject: (error: unknown) => void };
  let running = 0;
  const waiting: Entry[] = [];
  function start(entry: Entry): void {
    running += 1;
    Promise.resolve()
      .then(entry.job)
      .then(entry.resolve, entry.reject)
      .finally(() => {
        running -= 1; // in finally: a failed job frees its slot too
        const next = waiting.shift();
        if (next !== undefined) {
          start(next);
        }
      });
  }
  return {
    add<T>(job: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const entry: Entry = { job: job, resolve: resolve as (value: unknown) => void, reject: reject };
        if (running < concurrency) {
          start(entry);
        } else if (waiting.length < maxQueued) {
          waiting.push(entry);
        } else {
          reject(new QueueFull());
        }
      });
    },
    stats: () => ({ running: running, waiting: waiting.length }),
  };
}

// A pause that ends early, with the signal's reason, when the signal aborts.
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export type RetryOptions = { maxAttempts: number; baseMs: number; isRetryable: (error: unknown) => boolean; signal?: AbortSignal; random?: () => number };

// Calls fn(attempt) until it succeeds, the error is not retryable, or maxAttempts is reached. The pause
// before attempt n + 1 is random() × baseMs × 2^(n − 1). Only an idempotent fn may be retried.
export async function retry<T>(fn: (attempt: number) => Promise<T>, { maxAttempts, baseMs, isRetryable, signal, random = Math.random }: RetryOptions): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (error) {
      if (signal?.aborted || attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      await wait(random() * baseMs * 2 ** (attempt - 1), signal);
    }
  }
}
