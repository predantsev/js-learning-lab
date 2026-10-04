// Tests of the runtime schema in data/model.ts: a valid answer passes unchanged, and every broken
// field is named with its position. They run with `npm test` (Node.js strips the types).
import { test, expect } from "./testing.js";
import { parseExpense, parseExpenseList } from "../data/model.ts";

const GOOD = { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" };

test("parseExpenseList accepts valid expenses and keeps their values", () => {
  const result = parseExpenseList([GOOD]);
  expect(result.ok, "ok").toBe(true);
  expect(result.ok && result.value[0].id, "id of the first record").toBe(GOOD.id);
});

test("parseExpenseList names the broken field with its position: amountMinor", () => {
  const result = parseExpenseList([GOOD, { ...GOOD, id: "x-2", amountMinor: 12.5 }]);
  expect(result.ok, "ok").toBe(false);
  expect(!result.ok && result.errors["2.amountMinor"], "the error of record 2").toBe("notPositiveWhole");
});

test("parseExpense refuses category that breaks the schema, a missing field and a non-object", () => {
  const wrong = parseExpense({ ...GOOD, category: "travel" });
  expect(!wrong.ok && wrong.errors.category, "the category error").toBe("unknown");
  const missing = { ...GOOD };
  delete missing.id;
  expect(parseExpense(missing).ok, "a record without an id").toBe(false);
  expect(parseExpense("text").ok, "a text instead of a record").toBe(false);
});

test("parseExpenseList refuses two records with the same id and an answer that is not an array", () => {
  const twice = parseExpenseList([GOOD, GOOD]);
  expect(!twice.ok && twice.errors.id, "the id error").toBe("duplicate");
  expect(parseExpenseList({ records: [GOOD] }).ok, "an object instead of an array").toBe(false);
});
