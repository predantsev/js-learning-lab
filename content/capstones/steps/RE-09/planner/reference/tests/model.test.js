// Tests of the runtime schema in data/model.ts: a valid answer passes unchanged, and every broken
// field is named with its position. They run with `npm test` (Node.js strips the types).
import { test, expect } from "./testing.js";
import { parseTask, parseTaskList } from "../data/model.ts";

const GOOD = { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-01", done: false, priority: "high" };

test("parseTaskList accepts valid tasks and keeps their values", () => {
  const result = parseTaskList([GOOD]);
  expect(result.ok, "ok").toBe(true);
  expect(result.ok && result.value[0].id, "id of the first record").toBe(GOOD.id);
});

test("parseTaskList names the broken field with its position: priority", () => {
  const result = parseTaskList([GOOD, { ...GOOD, id: "x-2", priority: "urgent" }]);
  expect(result.ok, "ok").toBe(false);
  expect(!result.ok && result.errors["2.priority"], "the error of record 2").toBe("unknown");
});

test("parseTask refuses dueDate that breaks the schema, a missing field and a non-object", () => {
  const wrong = parseTask({ ...GOOD, dueDate: "2026-03-01T10:00" });
  expect(!wrong.ok && wrong.errors.dueDate, "the dueDate error").toBe("notCalendarDate");
  const missing = { ...GOOD };
  delete missing.id;
  expect(parseTask(missing).ok, "a record without an id").toBe(false);
  expect(parseTask("text").ok, "a text instead of a record").toBe(false);
});

test("parseTaskList refuses two records with the same id and an answer that is not an array", () => {
  const twice = parseTaskList([GOOD, GOOD]);
  expect(!twice.ok && twice.errors.id, "the id error").toBe("duplicate");
  expect(parseTaskList({ records: [GOOD] }).ok, "an object instead of an array").toBe(false);
});
