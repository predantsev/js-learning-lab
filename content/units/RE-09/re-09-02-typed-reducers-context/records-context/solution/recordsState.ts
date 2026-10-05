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
      if (state.status !== "idle" && state.status !== "success") return state;
      return { status: "loading" };
    case "loaded":
      if (state.status !== "loading") return state;
      return { status: "success", habits: action.habits };
    case "failed":
      if (state.status !== "loading") return state;
      return { status: "failure", message: action.message };
    case "retried":
      if (state.status !== "failure") return state;
      return { status: "loading" };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
