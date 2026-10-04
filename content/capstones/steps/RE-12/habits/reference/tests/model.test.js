// Tests of the runtime schema in data/model.ts: a valid answer passes unchanged, and every broken
// field is named with its position. They run with `npm test` (Node.js strips the types).
import { test, expect } from "./testing.js";
import { parseHabit, parseHabitList } from "../data/model.ts";

const GOOD = { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-03-01"] };

test("parseHabitList accepts valid habits and keeps their values", () => {
  const result = parseHabitList([GOOD]);
  expect(result.ok, "ok").toBe(true);
  expect(result.ok && result.value[0].id, "id of the first record").toBe(GOOD.id);
});

test("parseHabitList names the broken field with its position: completions", () => {
  const result = parseHabitList([GOOD, { ...GOOD, id: "x-2", completions: ["2026-03-01", "2026-03-01"] }]);
  expect(result.ok, "ok").toBe(false);
  expect(!result.ok && result.errors["2.completions"], "the error of record 2").toBe("duplicateDate");
});

test("parseHabit refuses frequency that breaks the schema, a missing field and a non-object", () => {
  const wrong = parseHabit({ ...GOOD, frequency: "monthly" });
  expect(!wrong.ok && wrong.errors.frequency, "the frequency error").toBe("unknown");
  const missing = { ...GOOD };
  delete missing.id;
  expect(parseHabit(missing).ok, "a record without an id").toBe(false);
  expect(parseHabit("text").ok, "a text instead of a record").toBe(false);
});

test("parseHabitList refuses two records with the same id and an answer that is not an array", () => {
  const twice = parseHabitList([GOOD, GOOD]);
  expect(!twice.ok && twice.errors.id, "the id error").toBe("duplicate");
  expect(parseHabitList({ records: [GOOD] }).ok, "an object instead of an array").toBe(false);
});
