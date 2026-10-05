import type { Habit } from "./habits";

export type RecordsState = { isLoading: boolean; error: string | null; habits: Habit[] | null };

export type RecordsAction =
  | { type: "started" }
  | { type: "loaded"; habits: Habit[] }
  | { type: "failed"; message: string }
  | { type: "retried" };

export function recordsReducer(state: RecordsState, action: RecordsAction): RecordsState {
  switch (action.type) {
    case "started":
    case "retried":
      return { ...state, isLoading: true };
    case "loaded":
      return { ...state, isLoading: false, habits: action.habits };
    case "failed":
      return { ...state, isLoading: false, error: action.message };
    default:
      return state;
  }
}
