import type { ReadingAction, ReadingState } from "./readingTypes";

export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case "loaded":
      return { status: "ready", books: action.books };
    case "loadFailed":
      return { status: "failed", message: action.message };
    case "reloaded":
      return { status: "loading" };
    default:
      return state;
  }
}
