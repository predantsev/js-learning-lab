// The totals of one month: #/expenses/months. The months that have expenses (from `date`), newest
// first, in a <select>; for the chosen one, the total of every category and the month's total.
import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Expense } from "../domain/expenses.ts";
import { totalsByCategory, totalOf, categoryText } from "../domain/expenses.ts";
import { Link } from "./router.tsx";
import { useExpensesList } from "./expensesCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { formatMoney, LOCALE } from "./format.js";

// Pure: the months ("YYYY-MM") that have expenses, newest first.
export function monthsOf(list: readonly Expense[]): string[] {
  return [...new Set(list.map((expense) => expense.date.slice(0, 7)))].sort().reverse();
}

// "2026-03" as "березень 2026 р." / "March 2026"; the first day of the month in UTC, like formatDay.
function formatMonth(month: string): string {
  return new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01"));
}

export function MonthTotals() {
  const all = useExpensesList("all");
  const headingRef = useHeadingFocus("%%monthTitle%%");
  // The chosen month, or "" for the newest one (known only once the list has arrived).
  const [chosen, setChosen] = useState("");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const months = monthsOf(all.items);
  const month = months.includes(chosen) ? chosen : (months[0] ?? "");
  const inMonth = all.items.filter((expense) => expense.date.startsWith(month + "-"));
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%monthTitle%%
      </h2>
      {months.length === 0 ? (
        <p>%%emptyMessage%%</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="month-select">%%monthLabel%%</label>
            <select id="month-select" value={month} onChange={(event: ChangeEvent<HTMLSelectElement>) => setChosen(event.target.value)}>
              {months.map((one) => (
                <option key={one} value={one}>
                  {formatMonth(one)}
                </option>
              ))}
            </select>
          </div>
          <dl>
            {[...totalsByCategory(inMonth)].map(([category, sum]) => (
              <div key={category}>
                <dt>{categoryText(category)}</dt>
                <dd>{formatMoney(sum, LOCALE)}</dd>
              </div>
            ))}
            <div>
              <dt>%%totalLabel%%</dt>
              <dd>{formatMoney(totalOf(inMonth), LOCALE)}</dd>
            </div>
          </dl>
        </>
      )}
      <p>
        <Link to="/expenses">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
