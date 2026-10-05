// The list screen: #/expenses. The form for a new expense, the category totals, the category filter
// and the cards. Two queries: the expenses of the chosen category for the cards, and all expenses for
// the totals. A filter change starts a new request and aborts the one still on its way. The filter is
// needed only here, so it is this screen's own state.
import { Profiler, useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { totalsByCategory, totalOf, categoryText, isCategoryId, searchExpenses } from "../domain/expenses.ts";
import type { ListFilter } from "../data/api.ts";
import { formatMoney, LOCALE } from "./format.js";
import { ExpenseForm } from "./ExpenseForm.tsx";
import { ExpenseList } from "./ExpenseList.tsx";
import { Section } from "./Section.tsx";
import { Link } from "./router.tsx";
import { QueryState } from "./QueryState.tsx";
import { useExpensesList, useExpenseMutations } from "./expensesCache.tsx";
import { useHeadingFocus } from "./focus.ts";
import { reportRender } from "./profile.ts";
import type { ExpenseFields } from "./expensesReducer.ts";

const PAGE_SIZE = 50;

export function ExpensesScreen() {
  const [filter, setFilter] = useState<ListFilter>("all");
  // The search: `text` is the field's value and stays urgent, so every letter shows at once; `query`
  // filters the list and changes in a transition, which React interrupts when the next letter comes.
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const list = useExpensesList(filter);
  const all = useExpensesList("all");
  const mutations = useExpenseMutations();
  // What the last change did or why it failed; role="status" reads it out.
  const [notice, setNotice] = useState("");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of an expense whose Delete button gets it,
  // "heading", or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = list.items ?? [];
  // The measured cause: every card of a long list was rendered at once. Now the list shows PAGE_SIZE
  // cards per page, and "Show more" adds the next page; a filter change starts from the first page.
  const [pages, setPages] = useState(1);
  const found = searchExpenses(shown, query);
  const visible = found.slice(0, pages * PAGE_SIZE);
  // Where focus goes after "Show more": the first card of the new page (its index), or null.
  const focusFirstNew = useRef<number | null>(null);

  useEffect(() => {
    const index = focusFirstNew.current;
    if (index === null) {
      return;
    }
    focusFirstNew.current = null;
    listRef.current?.querySelectorAll<HTMLAnchorElement>("li.card h3 a")[index]?.focus();
  }, [pages]);

  function showMore() {
    focusFirstNew.current = pages * PAGE_SIZE;
    setPages(pages + 1);
  }

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  async function handleCreate(fields: ExpenseFields): Promise<boolean> {
    const result = await mutations.create(fields);
    setNotice(result.ok ? "" : result.message);
    return result.ok;
  }

  // The removal is optimistic: the card leaves at once, so focus moves at once too. If the API
  // refuses, the card comes back and the message says which expense was not deleted.
  async function handleRemove(id: string) {
    const index = shown.findIndex((expense) => expense.id === id);
    const expense = shown[index];
    if (expense === undefined) {
      return;
    }
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    const result = await mutations.removeOptimistic(expense);
    setNotice(result.ok ? "" : result.message);
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);
    startTransition(() => {
      setQuery(value);
      setPages(1);
    });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || isCategoryId(value)) {
      setFilter(value);
      setPages(1);
    }
  }

  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = all.items === null ? [] : [...totalsByCategory(all.items)].map(([category, sum]) => categoryText(category) + ": " + formatMoney(sum, LOCALE));
  if (all.items !== null) {
    parts.push("%%totalLabel%%: " + formatMoney(totalOf(all.items), LOCALE));
  }
  return (
    <>
      <Section title="%%formTitle%%">
        <ExpenseForm expense={null} onSave={handleCreate} />
      </Section>
      <p role="status">{notice}</p>
      {all.items !== null && <p>{parts.join(" · ")}</p>}
      <p>
        <Link to="/expenses/summary">%%summaryLinkLabel%%</Link>
      </p>
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
        <div className="field">
          <label htmlFor="list-search">%%searchLabel%%</label>
          <input id="list-search" type="search" value={text} onChange={handleSearch} />
        </div>
        <p role="status">{isPending ? "%%searchingMessage%%" : ""}</p>
        <QueryState query={list} />
        {list.items !== null && (
          <Profiler id="list" onRender={reportRender}>
            <div ref={listRef} className={isPending ? "stale" : undefined} aria-busy={isPending}>
              <ExpenseList expenses={visible} emptyText={query !== "" ? "%%searchEmptyMessage%%" : filter === "all" ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onRemove={handleRemove} />
            </div>
            {visible.length < found.length && (
              <button type="button" onClick={showMore}>
                %%moreLabel%%
              </button>
            )}
          </Profiler>
        )}
      </Section>
    </>
  );
}
