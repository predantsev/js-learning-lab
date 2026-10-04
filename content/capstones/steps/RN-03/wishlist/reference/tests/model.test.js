// Tests of the runtime schema in data/model.ts: a valid answer passes unchanged, and every broken
// field is named with its position. They run with `npm test` (Node.js strips the types).
import { test, expect } from "./testing.js";
import { parseItem, parseItemList } from "../data/model.ts";

const GOOD = { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" };

test("parseItemList accepts valid wishes and keeps their values", () => {
  const result = parseItemList([GOOD]);
  expect(result.ok, "ok").toBe(true);
  expect(result.ok && result.value[0].id, "id of the first record").toBe(GOOD.id);
});

test("parseItemList names the broken field with its position: price", () => {
  const result = parseItemList([GOOD, { ...GOOD, id: "x-2", price: 12.5 }]);
  expect(result.ok, "ok").toBe(false);
  expect(!result.ok && result.errors["2.price"], "the error of record 2").toBe("notWholeNonNegative");
});

test("parseItem refuses category that breaks the schema, a missing field and a non-object", () => {
  const wrong = parseItem({ ...GOOD, category: "x".repeat(31) });
  expect(!wrong.ok && wrong.errors.category, "the category error").toBe("upTo30");
  const missing = { ...GOOD };
  delete missing.id;
  expect(parseItem(missing).ok, "a record without an id").toBe(false);
  expect(parseItem("text").ok, "a text instead of a record").toBe(false);
});

test("parseItemList refuses two records with the same id and an answer that is not an array", () => {
  const twice = parseItemList([GOOD, GOOD]);
  expect(!twice.ok && twice.errors.id, "the id error").toBe("duplicate");
  expect(parseItemList({ records: [GOOD] }).ok, "an object instead of an array").toBe(false);
});
