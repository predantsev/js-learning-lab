// Tests of expensesReducer in ui/expensesReducer.ts: every action gives a new list (or the same list
// when the domain rejects it), and the list it received is never changed.
import { test, expect } from "./testing.js";
import { expensesReducer } from "../ui/expensesReducer.ts";

// A fresh list for every test.
function sampleExpenses() {
  return [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-02", category: "transport" },
  ];
}

test("expensesReducer adds an expense of whole kopiykas with a free id", () => {
  const list = sampleExpenses();
  const next = expensesReducer(list, { type: "added", fields: { label: "%%newName%%", amountMinor: 14550, date: "2026-03-02", category: "transport" } });
  expect(next.length, "expenses after a valid draft").toBe(3);
  expect(next[2].id, "id of the new expense").toBe("e-3");
  expect(next[2].amountMinor, "amountMinor of the new expense").toBe(14550);
  expect(list.length, "the received list").toBe(2);
});

test("expensesReducer accepts only a whole amountMinor above zero", () => {
  const list = sampleExpenses();
  const fields = { label: "%%newName%%", amountMinor: 12.5, date: "2026-03-02", category: "fun" };
  expect(expensesReducer(list, { type: "added", fields: fields }), "adding 12.5 kopiykas").toBe(list);
  expect(expensesReducer(list, { type: "updated", id: "e-01", fields: fields }), "updating to 12.5 kopiykas").toBe(list);
  expect(expensesReducer(list, { type: "updated", id: "e-01", fields: { ...fields, amountMinor: 0 } }), "updating to 0 kopiykas").toBe(list);
});

test("expensesReducer updates one expense in a copy and removes only the given expense", () => {
  const list = sampleExpenses();
  const next = expensesReducer(list, { type: "updated", id: "e-01", fields: { label: "%%fixture1Name%%", amountMinor: 20000, date: "2026-03-01", category: "food" } });
  expect(next[0].amountMinor, "updated amountMinor").toBe(20000);
  expect(list[0].amountMinor, "amountMinor in the received list").toBe(84550);
  expect(next[1], "the other expense").toBe(list[1]);
  expect(expensesReducer(list, { type: "removed", id: "e-01" }).map((expense) => expense.id), "ids after removing e-01").toEqual(["e-02"]);
});
