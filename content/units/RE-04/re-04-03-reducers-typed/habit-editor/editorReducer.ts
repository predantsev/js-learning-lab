export type Habit = { id: string; name: string; active: boolean };

// Three modes of the habit editor. Each mode carries only the fields it needs.
export type EditorState =
  | { mode: "browsing"; habits: Habit[] }
  | { mode: "editing"; habits: Habit[]; id: string; draft: string }
  | { mode: "saveFailed"; habits: Habit[]; id: string; draft: string };

// Every action the editor understands: a discriminated union on `type`.
export type EditorAction =
  | { type: "editStarted"; id: string }
  | { type: "draftChanged"; text: string }
  | { type: "saveRequested" }
  | { type: "editCanceled" };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "editStarted": {
      if (state.mode !== "browsing") return state;
      const habit = state.habits.find((item) => item.id === action.id);
      if (habit === undefined) return state;
      return { mode: "editing", habits: state.habits, id: habit.id, draft: habit.name };
    }
    case "draftChanged": {
      if (state.mode === "browsing") return state;
      return { mode: "editing", habits: state.habits, id: state.id, draft: action.text };
    }
    case "saveRequested": {
      // Saving is possible only while editing: from any other mode the action is rejected.
      if (state.mode !== "editing") return state;
      const name = state.draft.trim();
      if (name === "") return { mode: "saveFailed", habits: state.habits, id: state.id, draft: state.draft };
      const habits = state.habits.map((item) => (item.id === state.id ? { ...item, name: name } : item));
      return { mode: "browsing", habits: habits };
    }
    case "editCanceled": {
      if (state.mode === "browsing") return state;
      return { mode: "browsing", habits: state.habits };
    }
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// The editor starts in browsing mode.
export const START: EditorState = {
  mode: "browsing",
  habits: [
    { id: "h-01", name: "%%exercise%%", active: true },
    { id: "h-02", name: "%%reading%%", active: true },
    { id: "h-03", name: "%%water%%", active: true },
  ],
};
