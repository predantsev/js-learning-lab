// Saving one task: four states, four actions.
export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "failed"; message: string };

export type SaveAction =
  | { type: "submitted" }
  | { type: "saved" }
  | { type: "failed"; message: string }
  | { type: "retried" };

export function saveReducer(state: SaveState, action: SaveAction): SaveState {
  switch (action.type) {
    case "submitted":
      if (state.status !== "idle" && state.status !== "saved") return state;
      return { status: "saving" };
    case "saved":
      if (state.status !== "saving") return state;
      return { status: "saved" };
    case "failed":
      if (state.status !== "saving") return state;
      return { status: "failed", message: action.message };
    case "retried":
      return state;
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
