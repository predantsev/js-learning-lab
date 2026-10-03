import type { Habit } from "./habits";

export type RecordsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; habits: Habit[] }
  | { status: "failure"; message: string };

export type RecordsAction =
  | { type: "started" }
  | { type: "loaded"; habits: Habit[] }
  | { type: "failed"; message: string }
  | { type: "retried" };

export function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  switch (action.type) {
    case "started":
    case "retried":
      return { status: "loading" };
    case "loaded":
      return { status: "success", habits: action.habits };
    case "failed":
      return { status: "failure", message: action.message };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
