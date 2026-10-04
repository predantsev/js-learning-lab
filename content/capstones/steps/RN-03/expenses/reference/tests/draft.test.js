// Tests of src/draft.ts: the form's text goes through the shared rules, and every error key has its
// message. No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { checkDraft, draftOf, fieldsOf, messageFor } from "../src/draft.ts";

test("draftOf gives empty fields for a new expense and the amount in hryvnias for a saved one", () => {
  expect(draftOf(null), "a new expense").toEqual({ label: "", amount: "", date: "", category: "" });
  expect(draftOf({ id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" }), "99.90").toEqual({ label: "%%fixture4Name%%", amount: "99%%decimalMark%%90", date: "2026-02-27", category: "home" });
});

test("checkDraft turns the typed hryvnias into whole kopiykas and keeps a valid expense", () => {
  expect(checkDraft({ label: " %%newName%% ", amount: "120,5", date: "2026-03-03", category: "transport" }), "120,5").toEqual({ ok: true, value: { label: "%%newName%%", amountMinor: 12050, date: "2026-03-03", category: "transport" } });
  expect(checkDraft({ label: "%%newName%%", amount: "99.90", date: "2026-03-03", category: "fun" }), "99.90").toEqual({ ok: true, value: { label: "%%newName%%", amountMinor: 9990, date: "2026-03-03", category: "fun" } });
});

test("checkDraft gives the error keys of validateExpense", () => {
  expect(checkDraft({ label: "  ", amount: "0", date: "", category: "" }), "everything empty or zero").toEqual({ ok: false, errors: { label: "required", amountMinor: "not-positive-integer", category: "unknown", date: "bad-date" } });
  expect(checkDraft({ label: "%%newName%%", amount: "12.345", date: "2026-03-03", category: "food" }), "three decimal digits").toEqual({ ok: false, errors: { amountMinor: "not-positive-integer" } });
});

test("messageFor has a text for every error key and none without a key", () => {
  for (const key of ["required", "too-long", "not-positive-integer", "unknown", "bad-date"]) {
    expect(messageFor(key) !== "", "a message for " + key).toBe(true);
  }
  expect(messageFor(undefined), "no key").toBe("");
});

test("fieldsOf keeps exactly the cleaned values of validateExpense", () => {
  const value = { label: "%%newName%%", amountMinor: 12050, date: "2026-03-03", category: "transport" };
  expect(fieldsOf(value), "the fields").toEqual({ label: "%%newName%%", amountMinor: 12050, date: "2026-03-03", category: "transport" });
});
