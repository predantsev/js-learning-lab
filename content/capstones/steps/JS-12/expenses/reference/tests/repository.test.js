// Tests of the expense repository in storage/repository.js. The same tests run for both designs,
// the class and the factory, so both must behave the same. A small stand-in object plays the
// storage: it has getItem and setItem like localStorage, but keeps the text in a plain object.
import { test, expect } from "./testing.js";
import { ExpenseRepository, createExpenseRepository } from "../storage/repository.js";
import { loadExpenses } from "../storage/expenses.js";

function memoryStorage() {
  const data = {};
  return {
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

// A fresh list for every test. Two expenses share the category "food".
function sampleExpenses() {
  return [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
    { id: "e-03", label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
  ];
}

const designs = [
  ["class", (storage, expenses) => new ExpenseRepository(storage, expenses)],
  ["factory", (storage, expenses) => createExpenseRepository(storage, expenses)],
];

for (const [design, create] of designs) {
  test(design + ": items gives a copy of the list", () => {
    const repository = create(memoryStorage(), sampleExpenses());
    repository.items.push({ id: "e-99" });
    expect(repository.items.map((expense) => expense.id), "ids after a push into the returned array").toEqual(["e-01", "e-02", "e-03"]);
  });

  test(design + ": add keeps a valid expense and refuses an invalid one", () => {
    const repository = create(memoryStorage(), sampleExpenses());
    repository.add("e-04", { label: "%%newName%%", amountMinor: 4500, date: "2026-03-02", category: "transport" });
    repository.add("e-05", { label: "%%newName%%", amountMinor: 12.5, date: "2026-03-02", category: "transport" });
    expect(repository.items.map((expense) => expense.id), "ids after a valid and an invalid draft").toEqual(["e-01", "e-02", "e-03", "e-04"]);
  });

  test(design + ": remove deletes one expense and saves", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleExpenses());
    repository.remove("e-02");
    expect(repository.items.map((expense) => expense.id), "ids after remove").toEqual(["e-01", "e-03"]);
    expect(loadExpenses(storage), "saved after remove").toEqual({ ok: true, expenses: repository.items });
  });

  test(design + ": update changes one expense and saves", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleExpenses());
    repository.update("e-02", { amountMinor: 50000 });
    expect(repository.items.map((expense) => expense.amountMinor), "amounts after update").toEqual([84550, 50000, 21050]);
    expect(loadExpenses(storage), "saved after update").toEqual({ ok: true, expenses: repository.items });
  });

  test(design + ": totalByCategory adds up the expenses of every category", () => {
    const repository = create(memoryStorage(), sampleExpenses());
    expect(repository.totalByCategory(), "totals of the sample").toEqual({ food: 105600, transport: 52000, home: 0, fun: 0 });
    expect(create(memoryStorage(), []).totalByCategory(), "totals of []").toEqual({ food: 0, transport: 0, home: 0, fun: 0 });
  });
}
