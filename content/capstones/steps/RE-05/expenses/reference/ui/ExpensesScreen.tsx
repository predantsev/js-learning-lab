// The list screen: #/expenses. The form for a new expense, the category totals, the category filter
// and the cards. The filter is needed only here, so it is this screen's own state; the list comes from
// the data hook.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { totalsByCategory, totalOf, categoryText, filterExpenses, isCategoryId } from "../domain/expenses.ts";
import type { CategoryId } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";
import { ExpenseForm } from "./ExpenseForm.tsx";
import { ExpenseList } from "./ExpenseList.tsx";
import { Section } from "./Section.tsx";
import { useExpensesData } from "./useExpenses.ts";
import { useHeadingFocus } from "./focus.ts";
import type { ExpenseFields } from "./expensesReducer.ts";

type Filter = "all" | CategoryId;

export function ExpensesScreen() {
  const { expenses, dispatch } = useExpensesData();
  const [filter, setFilter] = useState<Filter>("all");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of an expense whose Delete button gets it,
  // "heading", or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = filter === "all" ? expenses : filterExpenses(expenses, filter);
  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = [...totalsByCategory(expenses)].map(([category, sum]) => categoryText(category) + ": " + formatMoney(sum, LOCALE));
  parts.push("%%totalLabel%%: " + formatMoney(totalOf(expenses), LOCALE));

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleRemove(id: string) {
    const index = shown.findIndex((expense) => expense.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || isCategoryId(value)) {
      setFilter(value);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <ExpenseForm expense={null} onSave={(fields: ExpenseFields) => dispatch({ type: "added", fields: fields })} />
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
          <ExpenseList expenses={shown} emptyText={expenses.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onRemove={handleRemove} />
        </div>
      </Section>
    </>
  );
}
