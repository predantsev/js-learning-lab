// Tests of habitsReducer in ui/habitsReducer.ts: every action gives a new list (or the same list when
// the domain rejects it), and the list it received is never changed.
import { test, expect } from "./testing.js";
import { habitsReducer } from "../ui/habitsReducer.ts";

// A fresh list for every test.
function sampleHabits() {
  return [
    { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] },
    { id: "h-02", name: "%%fixture2Name%%", frequency: "weekly", active: false, completions: [] },
  ];
}

test("habitsReducer adds a valid habit with a free id and refuses an invalid one", () => {
  const list = sampleHabits();
  const next = habitsReducer(list, { type: "added", fields: { name: "%%newName%%", frequency: "daily", active: true } });
  expect(next.length, "habits after a valid draft").toBe(3);
  expect(next[2].id, "id of the new habit").toBe("h-3");
  expect(list.length, "the received list").toBe(2);
  const same = habitsReducer(list, { type: "added", fields: { name: "  ", frequency: "daily", active: true } });
  expect(same, "an empty name").toBe(list);
});

test("habitsReducer adds the passed-in day once and keeps the other days", () => {
  const list = sampleHabits();
  const next = habitsReducer(list, { type: "completionAdded", id: "h-01", day: "2026-03-02" });
  expect(next[0].completions, "days after adding 2026-03-02").toEqual(["2026-03-01", "2026-03-02"]);
  expect(list[0].completions, "days in the received list").toEqual(["2026-03-01"]);
  expect(habitsReducer(next, { type: "completionAdded", id: "h-01", day: "2026-03-02" }), "the same day again").toBe(next);
});

test("habitsReducer toggles active in a copy, refuses an invalid update and removes only the given habit", () => {
  const list = sampleHabits();
  const toggled = habitsReducer(list, { type: "activeToggled", id: "h-02" });
  expect(toggled[1].active, "toggled habit").toBe(true);
  expect(toggled[0], "the other habit").toBe(list[0]);
  const refused = habitsReducer(list, { type: "updated", id: "h-01", fields: { name: "%%fixture1Name%%", frequency: "monthly", active: true } });
  expect(refused, "an unknown frequency").toBe(list);
  expect(habitsReducer(list, { type: "removed", id: "h-01" }).map((habit) => habit.id), "ids after removing h-01").toEqual(["h-02"]);
});
