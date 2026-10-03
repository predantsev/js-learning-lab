// The whole page as a tree of components: App → Section → ExpenseForm and Section → ExpenseList →
// one ExpenseCard per expense. App owns the list, the expense being edited and the category filter;
// every change is a new list computed by the pure domain functions, which stay exactly as they were.
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { totalsByCategory, totalOf, categoryText, filterExpenses, isCategoryId, addExpense, updateExpense, removeExpense } from "../domain/expenses.ts";
import type { Expense, CategoryId } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";
import { ExpenseForm } from "./ExpenseForm.tsx";
import type { ExpenseFields } from "./ExpenseForm.tsx";
import { ExpenseList } from "./ExpenseList.tsx";
import { Section } from "./Section.tsx";
import { loadExpenses, saveExpenses } from "../storage/expenses.ts";

type Filter = "all" | CategoryId;

// An id that no expense of the list has yet (saved expenses may already use "e-7").
function newId(list: Expense[]): string {
  let number = list.length + 1;
  while (list.some((expense) => expense.id === "e-" + number)) {
    number += 1;
  }
  return "e-" + number;
}

type AppProps = { startingExpenses: Expense[] };

export function App({ startingExpenses }: AppProps) {
  // Read once: a function given to useState runs only on the first render. loadExpenses checks every
  // saved record; without usable saved expenses the list starts from the starting ones.
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = loadExpenses(localStorage);
    return saved.ok ? saved.expenses : startingExpenses;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // Keeps localStorage in step with the list: after every commit in which `expenses` changed, the
  // whole list is written as { schemaVersion: 1, records }, replacing what was stored. Writing the
  // same list again changes nothing, so StrictMode's second run in development is harmless; a write
  // switches nothing on, so the effect needs no cleanup.
  useEffect(() => {
    saveExpenses(localStorage, expenses);
  }, [expenses]);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = expenses.find((expense) => expense.id === editingId) ?? null;
  const shown = filter === "all" ? expenses : filterExpenses(expenses, filter);
  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = [...totalsByCategory(expenses)].map(([category, sum]) => categoryText(category) + ": " + formatMoney(sum, LOCALE));
  parts.push("%%totalLabel%%: " + formatMoney(totalOf(expenses), LOCALE));

  function handleSave(fields: ExpenseFields) {
    if (editingId === null) {
      setExpenses((previous) => addExpense(previous, newId(previous), fields));
    } else {
      const id = editingId;
      setExpenses((previous) => updateExpense(previous, id, fields));
      setEditingId(null);
    }
  }

  function handleRemove(id: string) {
    setExpenses((previous) => removeExpense(previous, id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || isCategoryId(value)) {
      setFilter(value);
    }
  }

  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/expense.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        {/* A new key gives a new form: picking another expense starts the form from that expense's data. */}
        <ExpenseForm key={editingId ?? "new"} expense={editing} onSave={handleSave} onCancel={() => setEditingId(null)} />
      </Section>
      <p>{parts.join(" · ")}</p>
      <Section title="%%listTitle%%">
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="food">%%categoryFood%%</option>
            <option value="transport">%%categoryTransport%%</option>
            <option value="home">%%categoryHome%%</option>
            <option value="fun">%%categoryFun%%</option>
          </select>
        </div>
        <ExpenseList expenses={shown} emptyText={expenses.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onEdit={setEditingId} onRemove={handleRemove} />
      </Section>
    </main>
  );
}
