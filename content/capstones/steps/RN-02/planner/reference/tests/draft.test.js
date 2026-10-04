// Tests of src/draft.ts: the form's text goes through the shared rules, and every error key has its
// message. No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { checkDraft, draftOf, messageFor } from "../src/draft.ts";

test("draftOf gives empty fields and the normal priority for a new task, text for a saved one", () => {
  expect(draftOf(null), "a new task").toEqual({ title: "", dueDate: "", priority: "normal" });
  expect(draftOf({ id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" }), "no due date").toEqual({ title: "%%fixture3Name%%", dueDate: "", priority: "low" });
});

test("checkDraft treats an empty due date as no due date and keeps a valid task", () => {
  expect(checkDraft({ title: " %%newName%% ", dueDate: "", priority: "normal" }), "empty due date").toEqual({ ok: true, value: { title: "%%newName%%", dueDate: null, priority: "normal" } });
  expect(checkDraft({ title: "%%newName%%", dueDate: "2026-03-04", priority: "high" }), "a due date").toEqual({ ok: true, value: { title: "%%newName%%", dueDate: "2026-03-04", priority: "high" } });
});

test("checkDraft gives the error keys of validateTask", () => {
  expect(checkDraft({ title: "  ", dueDate: "4.03.2026", priority: "normal" }), "empty title, a dotted date").toEqual({ ok: false, errors: { title: "required", dueDate: "bad-date" } });
  expect(checkDraft({ title: "%%newName%%", dueDate: "", priority: "urgent" }), "an unknown priority").toEqual({ ok: false, errors: { priority: "unknown" } });
});

test("messageFor has a text for every error key and none without a key", () => {
  for (const key of ["required", "too-long", "unknown", "bad-date"]) {
    expect(messageFor(key) !== "", "a message for " + key).toBe(true);
  }
  expect(messageFor(undefined), "no key").toBe("");
});
