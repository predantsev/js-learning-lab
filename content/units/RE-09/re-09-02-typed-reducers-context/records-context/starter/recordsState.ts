import type { Habit } from "./habits";

// TODO: describe the request as a discriminated union on `status`:
//   "idle"                      — nothing requested yet
//   "loading"                   — a request is running
//   "success" with `habits`     — the list arrived
//   "failure" with `message`    — the request failed
export type RecordsState = { status: "idle" };

export type RecordsAction =
  | { type: "started" }
  | { type: "loaded"; habits: Habit[] }
  | { type: "failed"; message: string }
  | { type: "retried" };

// TODO: the allowed transitions (every other pair returns the same state object):
//   idle    + started → loading        success + started → loading
//   loading + loaded  → success        loading + failed  → failure
//   failure + retried → loading
export function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  return state;
}
