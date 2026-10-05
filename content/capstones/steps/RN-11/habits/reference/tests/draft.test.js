// Tests of src/draft.ts: the form's text goes through the shared rules, and every error key has its
// message. No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { checkDraft, draftOf, fieldsOf, hasUnsavedChanges, messageFor } from "../src/draft.ts";

test("draftOf gives an empty name and the daily frequency for a new habit, the fields of a saved one", () => {
  expect(draftOf(null), "a new habit").toEqual({ name: "", frequency: "daily" });
  expect(draftOf({ id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: true, completions: [] }), "a weekly habit").toEqual({ name: "%%fixture4Name%%", frequency: "weekly" });
});

test("checkDraft keeps a valid habit with a trimmed name", () => {
  expect(checkDraft({ name: " %%newName%% ", frequency: "weekly" }), "a weekly habit").toEqual({ ok: true, value: { name: "%%newName%%", frequency: "weekly" } });
});

test("checkDraft gives the error keys of validateHabit", () => {
  expect(checkDraft({ name: "  ", frequency: "monthly" }), "empty name, unknown frequency").toEqual({ ok: false, errors: { name: "required", frequency: "unknown" } });
  expect(checkDraft({ name: "a".repeat(81), frequency: "daily" }), "81 characters").toEqual({ ok: false, errors: { name: "too-long" } });
});

test("messageFor has a text for every error key and none without a key", () => {
  for (const key of ["required", "too-long", "unknown"]) {
    expect(messageFor(key) !== "", "a message for " + key).toBe(true);
  }
  expect(messageFor(undefined), "no key").toBe("");
});

test("fieldsOf keeps the cleaned values and the active flag of the habit being edited", () => {
  const value = { name: "%%newName%%", frequency: "weekly" };
  expect(fieldsOf(value, true), "a new habit").toEqual({ name: "%%newName%%", frequency: "weekly", active: true });
  expect(fieldsOf(value, false), "a paused habit").toEqual({ name: "%%newName%%", frequency: "weekly", active: false });
});

test("hasUnsavedChanges is false for an unchanged form and true for a changed name or frequency", () => {
  const saved = { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: [] };
  expect(hasUnsavedChanges(draftOf(saved), saved), "unchanged").toBe(false);
  expect(hasUnsavedChanges({ name: " %%fixture1Name%% ", frequency: "daily" }, saved), "only spaces").toBe(false);
  expect(hasUnsavedChanges({ name: "%%newName%%", frequency: "daily" }, saved), "a new name").toBe(true);
  expect(hasUnsavedChanges({ name: "%%fixture1Name%%", frequency: "weekly" }, saved), "another frequency").toBe(true);
});
