import { test, expect } from "./testing";
import { subject } from "./subject";
import type { ReadingState } from "./readingTypes";

const loading: ReadingState = { status: "loading" };
const ready: ReadingState = { status: "ready", books: [] };
const failed: ReadingState = { status: "failed", message: "x" };
// Looked up on every call, so the checks can swap the reducer in `subject`.
const reduce: typeof subject.readingReducer = (state, action) => subject.readingReducer(state, action);

test("loading → ready / failed", () => {
  expect(reduce(loading, { type: "loaded", books: [] }).status).toBe("ready");
  expect(reduce(loading, { type: "loadFailed", message: "x" }).status).toBe("failed");
});
test("ready + loaded refreshes the list", () => {
  expect(reduce(ready, { type: "loaded", books: [] }).status).toBe("ready");
});
test("a failed refresh keeps the list", () => {
  expect(reduce(ready, { type: "loadFailed", message: "x" })).toBe(ready);
});
test("reloaded leaves loading and ready alone", () => {
  expect(reduce(loading, { type: "reloaded" })).toBe(loading);
  expect(reduce(ready, { type: "reloaded" })).toBe(ready);
});
test("a late answer after a failure is ignored", () => {
  expect(reduce(failed, { type: "loaded", books: [] })).toBe(failed);
});
test("a second failure changes nothing", () => {
  expect(reduce(failed, { type: "loadFailed", message: "y" })).toBe(failed);
});
test("failed + reloaded → loading", () => {
  expect(reduce(failed, { type: "reloaded" }).status).toBe("loading");
});
test("the same action twice from loading", () => {
  const once = reduce(loading, { type: "loaded", books: [] });
  expect(reduce(once, { type: "reloaded" })).toBe(once);
});
