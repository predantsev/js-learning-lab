// The whole page as a tree of components: App → Section → ExpenseForm and Section → ExpenseList →
// one ExpenseCard per expense. App is the lowest common parent of the form and the list, so the shared
// state lives here: the list (through useExpenses), the expense being edited and the category filter.
// What only one card needs (a delete waiting for its confirmation) stays in that card.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { totalsByCategory, totalOf, categoryText, filterExpenses, isCategoryId } from "../domain/expenses.ts";
import type { Expense, CategoryId } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";
import { ExpenseForm } from "./ExpenseForm.tsx";
import { ExpenseList } from "./ExpenseList.tsx";
import { Section } from "./Section.tsx";
import { useExpenses } from "./useExpenses.ts";
import type { ExpenseFields } from "./expensesReducer.ts";

type Filter = "all" | CategoryId;

type AppProps = { startingExpenses: Expense[] };

export function App({ startingExpenses }: AppProps) {
  const [expenses, dispatch] = useExpenses(startingExpenses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of an expense whose Delete button gets it,
  // "heading", or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = expenses.find((expense) => expense.id === editingId) ?? null;
  const shown = filter === "all" ? expenses : filterExpenses(expenses, filter);
  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = [...totalsByCategory(expenses)].map(([category, sum]) => categoryText(category) + ": " + formatMoney(sum, LOCALE));
  parts.push("%%totalLabel%%: " + formatMoney(totalOf(expenses), LOCALE));

  // Runs after every commit; it does something only when a delete has asked for it. The card that had
  // focus is gone after the commit, so focus moves to the next card (or the previous one), and to the
  // list heading when no card is left.
  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleSave(fields: ExpenseFields) {
    if (editingId === null) {
      dispatch({ type: "added", fields: fields });
    } else {
      dispatch({ type: "updated", id: editingId, fields: fields });
      setEditingId(null);
    }
  }

  function handleRemove(id: string) {
    const index = shown.findIndex((expense) => expense.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
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
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
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
        <div ref={listRef}>
          <ExpenseList expenses={shown} emptyText={expenses.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onEdit={setEditingId} onRemove={handleRemove} />
        </div>
      </Section>
    </main>
  );
}
