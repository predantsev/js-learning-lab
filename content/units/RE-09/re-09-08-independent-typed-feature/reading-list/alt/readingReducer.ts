import type { ReadingAction, ReadingState } from "./readingTypes";

// Allowed arrows: loading/ready + loaded → ready, loading + loadFailed → failed, failed + reloaded → loading.
export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  if (action.type === "loaded" && state.status !== "failed") return { status: "ready", books: action.books };
  if (action.type === "loadFailed" && state.status === "loading") return { status: "failed", message: action.message };
  if (action.type === "reloaded" && state.status === "failed") return { status: "loading" };
  return state;
}
