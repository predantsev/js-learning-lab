import type { Habit } from "./habits";

type Idle = { status: "idle" };
type Loading = { status: "loading" };
type Success = { status: "success"; habits: Habit[] };
type Failure = { status: "failure"; message: string };
export type RecordsState = Idle | Loading | Success | Failure;

export type RecordsAction =
  | { type: "started" }
  | { type: "loaded"; habits: Habit[] }
  | { type: "failed"; message: string }
  | { type: "retried" };

export function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  if (action.type === "started" && (state.status === "idle" || state.status === "success")) return { status: "loading" };
  if (action.type === "retried" && state.status === "failure") return { status: "loading" };
  if (state.status === "loading") {
    if (action.type === "loaded") return { status: "success", habits: action.habits };
    if (action.type === "failed") return { status: "failure", message: action.message };
  }
  return state;
}
