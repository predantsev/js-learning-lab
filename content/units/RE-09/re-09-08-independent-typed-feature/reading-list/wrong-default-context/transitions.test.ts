import { test, expect } from "./testing";
import { subject } from "./subject";
import type { Book, ReadingAction, ReadingState } from "./readingTypes";

const book: Book = { id: "b-09", title: "%%bookSea%%", author: "%%authorSea%%", pages: 320, status: "reading" };
const STATES: Record<ReadingState["status"], ReadingState> = {
  loading: { status: "loading" },
  ready: { status: "ready", books: [book] },
  failed: { status: "failed", message: "listFailed" },
};
const ACTIONS: Record<ReadingAction["type"], ReadingAction> = {
  loaded: { type: "loaded", books: [] },
  loadFailed: { type: "loadFailed", message: "listFailed" },
  reloaded: { type: "reloaded" },
};

type Row = [from: ReadingState["status"], action: ReadingAction["type"], to: ReadingState["status"] | "same"];
const TABLE: Row[] = [
  ["loading", "loaded", "ready"],
  ["loading", "loadFailed", "failed"],
  ["loading", "reloaded", "same"],
  ["ready", "loaded", "ready"],
  ["ready", "loadFailed", "same"],
  ["ready", "reloaded", "same"],
  ["failed", "loaded", "same"],
  ["failed", "loadFailed", "same"],
  ["failed", "reloaded", "loading"],
];

for (const [from, action, to] of TABLE) {
  test(`${from} + ${action} → ${to}`, () => {
    const state = STATES[from];
    const next = subject.readingReducer(state, ACTIONS[action]);
    if (to === "same") expect(next).toBe(state);
    else expect(next.status).toBe(to);
  });
}
