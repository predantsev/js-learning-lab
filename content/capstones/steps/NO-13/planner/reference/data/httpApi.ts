// The HTTP data source of the planner: the same functions as the fixture API (data/fixtureApi.ts), but
// every call is a request to the records server's /v1 API (server/, 127.0.0.1:4311 by default). The server
// is the source of truth: this module keeps no copy of the tasks, and every answer passes the shared
// contract (shared/contract.ts) before anyone uses it. `fetch` is a parameter, so a test can pass its own.
//
// - listTasks(filter) walks every page of GET /v1/records (?limit=50&cursor=…) and answers one list.
// - A read is retried at most twice, after 100 and 200 ms, and only when it may pass next time: no
//   connection (fetch rejects with a TypeError) or a 5xx. A 4xx and an answer of the wrong shape are not
//   retried. An abort is never retried.
// - A create carries an Idempotency-Key made once per call, so its retry (same rules) cannot add the
//   task twice. A change (PUT, PATCH) and a delete are not retried: the person presses the button again.
import type { Task } from "../domain/tasks.ts";
import { PAGE_LIMIT_V1, RECORDS_PATH_V1, parseErrorBodyV1, parseListPageV1, parseTaskV1 } from "../shared/contract.ts";
import { ApiError } from "./apiError.ts";
import type { ListFilter } from "./fixtureApi.ts";
import type { TaskFields } from "../ui/tasksReducer.ts";

// Pages one list may take: 200 × 50 = 10,000 tasks. More is a refusal, not an endless loop.
const MAX_PAGES = 200;
const RETRY_DELAYS_MS = [100, 200];
// A request that has not answered in this time is given up (a TimeoutError), like no connection.
const TIMEOUT_MS = 5000;

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

// An answer that is not what the contract promises: not JSON, or JSON of the wrong shape.
export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidResponseError";
  }
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

// The query of a list filter: the server filters by `done` ("pending" is done=false).
function filterQuery(filter: ListFilter): string {
  return filter === "all" ? "" : "&done=" + String(filter === "done");
}

export function createHttpApi({ baseUrl, fetch, timeoutMs = TIMEOUT_MS }: { baseUrl: string; fetch: FetchFn; timeoutMs?: number }) {
  // One request: the answer's JSON when it is ok, otherwise an ApiError with the status and the error code
  // of the body. `retry` says whether a failure that may pass is tried again.
  async function send(method: string, path: string, options: { body?: unknown; headers?: Record<string, string>; signal?: AbortSignal; retry?: boolean } = {}): Promise<unknown> {
    const headers: Record<string, string> = { ...options.headers };
    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
    }
    for (let attempt = 0; ; attempt++) {
      const signal = options.signal === undefined ? AbortSignal.timeout(timeoutMs) : AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]);
      let failure: unknown;
      try {
        const response = await fetch(baseUrl + path, { method: method, headers: headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: signal });
        const text = await response.text();
        if (response.ok) {
          if (text === "") {
            return undefined;
          }
          try {
            return JSON.parse(text);
          } catch {
            throw new InvalidResponseError(`${method} ${path}: the answer is not JSON`);
          }
        }
        let code = "";
        try {
          const parsed = parseErrorBodyV1(JSON.parse(text));
          code = parsed.ok ? " " + parsed.value.error.code : "";
        } catch {
          // A refusal without the error body of the contract keeps only its status.
        }
        failure = new ApiError(response.status, `${method} ${path} → ${response.status}${code}`);
        if (response.status < 500) {
          throw failure;
        }
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) {
          throw error;
        }
        if (error instanceof InvalidResponseError || options.signal?.aborted) {
          throw error;
        }
        failure = error;
      }
      // Here: no connection, a timeout or a 5xx.
      if (options.retry !== true || attempt >= RETRY_DELAYS_MS.length) {
        throw failure;
      }
      await pause(RETRY_DELAYS_MS[attempt], options.signal);
    }
  }

  function task(answer: unknown, what: string): Task {
    const parsed = parseTaskV1(answer);
    if (!parsed.ok) {
      throw new InvalidResponseError(`${what}: ${Object.entries(parsed.errors).map(([field, code]) => field + ": " + code).join(", ")}`);
    }
    return parsed.value;
  }

  const one = (id: string) => RECORDS_PATH_V1 + "/" + encodeURIComponent(id);

  return {
    // Every task of the filter, page after page; the answer is checked page by page.
    async listTasks(filter: ListFilter, signal?: AbortSignal): Promise<unknown> {
      const tasks: Task[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const path: string = `${RECORDS_PATH_V1}?limit=${PAGE_LIMIT_V1}${filterQuery(filter)}${cursor === null ? "" : "&cursor=" + encodeURIComponent(cursor)}`;
        const parsed = parseListPageV1(await send("GET", path, { signal: signal, retry: true }));
        if (!parsed.ok) {
          throw new InvalidResponseError(`GET ${path}: ${Object.entries(parsed.errors).map(([field, code]) => field + ": " + code).join(", ")}`);
        }
        tasks.push(...parsed.value.items);
        cursor = parsed.value.nextCursor;
        if (cursor === null) {
          return tasks;
        }
      }
      throw new InvalidResponseError(`GET ${RECORDS_PATH_V1}: more than ${MAX_PAGES} pages`);
    },
    async createTask(fields: TaskFields): Promise<void> {
      const key = crypto.randomUUID();
      task(await send("POST", RECORDS_PATH_V1, { body: fields, headers: { "idempotency-key": key }, retry: true }), "POST");
    },
    async saveTask(id: string, fields: TaskFields): Promise<void> {
      task(await send("PUT", one(id), { body: fields }), "PUT");
    },
    async setDone(id: string, done: boolean): Promise<void> {
      task(await send("PATCH", one(id), { body: { done: done } }), "PATCH");
    },
    async deleteTask(id: string): Promise<void> {
      await send("DELETE", one(id));
    },
  };
}

export type HttpApi = ReturnType<typeof createHttpApi>;
