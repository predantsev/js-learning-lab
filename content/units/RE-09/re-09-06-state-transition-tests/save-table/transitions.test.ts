import { test, expect } from "./testing";
import { saveReducer } from "./saveReducer";
import type { SaveAction, SaveState } from "./saveReducer";

const STATES: Record<SaveState["status"], SaveState> = {
  idle: { status: "idle" },
  saving: { status: "saving" },
  saved: { status: "saved" },
  failed: { status: "failed", message: "503" },
};

const ACTIONS: Record<SaveAction["type"], SaveAction> = {
  submitted: { type: "submitted" },
  saved: { type: "saved" },
  failed: { type: "failed", message: "503" },
  retried: { type: "retried" },
};

// "same" means: the reducer returns the very same state object — the action is rejected.
type Row = [from: SaveState["status"], action: SaveAction["type"], to: SaveState["status"] | "same"];

const TABLE: Row[] = [
  ["idle", "submitted", "saving"],
  ["idle", "saved", "same"],
  ["idle", "failed", "same"],
  ["idle", "retried", "same"],
  ["saving", "submitted", "same"],
  ["saving", "saved", "saved"],
  ["saving", "failed", "failed"],
  ["saving", "retried", "same"],
  ["saved", "submitted", "saving"],
  ["saved", "saved", "same"],
  ["saved", "failed", "same"],
  ["saved", "retried", "same"],
  ["failed", "submitted", "same"],
  ["failed", "saved", "same"],
  ["failed", "failed", "same"],
];

for (const [from, actionType, to] of TABLE) {
  test(`${from} + ${actionType} → ${to}`, () => {
    const state = STATES[from];
    const next = saveReducer(state, ACTIONS[actionType]);
    if (to === "same") expect(next, "%%sameObject%%").toBe(state);
    else expect(next.status).toBe(to);
  });
}
