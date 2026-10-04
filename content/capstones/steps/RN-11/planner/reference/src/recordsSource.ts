// The tasks of the course's mock service (GET /records/planner), checked by the shared contract
// parseTaskList like any data from outside. What happens on a failure, after fetchWithRetry gave up:
//   offline (no connection at all) → the bundled starting tasks, said so on the screen;
//   invalid (an answer of the wrong shape) → the bundled starting tasks, said so on the screen;
//   timeout or server (a 5xx or another error status) → no data, and a "try again" button.
// Anything derived is computed only from data that actually loaded — the screen shows none for "no data".
// An AbortError is not a failure: it is passed on, and the screen that lost the focus ignores it.
import { parseTaskList } from "../data/model.ts";
import type { Task } from "../domain/tasks.ts";
import { fetchWithRetry } from "./fetchWithRetry.ts";
import type { FetchFn } from "./fetchWithRetry.ts";

export type LoadOutcome =
  | { source: "service"; records: Task[] }
  | { source: "bundled"; records: Task[]; failure: "offline" | "invalid" }
  | { source: "none"; failure: "timeout" | "server"; status?: number };

export type ServiceRequest = {
  baseUrl: string;
  lang: string;
  rehearsal: string; // failure switches of the mock service, "" for none
  fetchFn: FetchFn;
  signal?: AbortSignal;
  timeoutMs?: number;
  baseDelayMs?: number;
};

export function recordsUrl(baseUrl: string, lang: string, rehearsal: string): string {
  return baseUrl + "/records/planner?lang=" + encodeURIComponent(lang) + (rehearsal === "" ? "" : "&" + rehearsal);
}

export async function loadFromService(request: ServiceRequest, bundled: Task[]): Promise<LoadOutcome> {
  let response;
  try {
    response = await fetchWithRetry(recordsUrl(request.baseUrl, request.lang, request.rehearsal), {
      fetchFn: request.fetchFn,
      signal: request.signal,
      timeoutMs: request.timeoutMs,
      baseDelayMs: request.baseDelayMs,
      maxAttempts: 3,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return { source: "none", failure: "timeout" };
    }
    return { source: "bundled", records: [...bundled], failure: "offline" };
  }
  if (!response.ok) {
    return { source: "none", failure: "server", status: response.status };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { source: "bundled", records: [...bundled], failure: "invalid" };
  }
  const parsed = parseTaskList(body);
  return parsed.ok ? { source: "service", records: parsed.value } : { source: "bundled", records: [...bundled], failure: "invalid" };
}
