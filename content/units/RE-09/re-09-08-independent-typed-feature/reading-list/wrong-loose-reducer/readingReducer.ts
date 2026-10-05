import type { ReadingAction, ReadingState } from "./readingTypes";

export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case "loaded":
      // The first answer, or a fresh list after a write.
      if (state.status === "failed") return state;
      return { status: "ready", books: action.books };
    case "loadFailed":
      if (state.status === "failed") return state;
      return { status: "failed", message: action.message };
    case "reloaded":
      if (state.status !== "failed") return state;
      return { status: "loading" };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
