// The list page that the server renders (server/src/page.ts, renderToString) and the browser hydrates
// (ssr/client.ts, hydrateRoot) — one component, one function that builds its element, so the two renders
// cannot drift apart. No JSX: Node runs this file as it is (type stripping), and Node does not read JSX.
// The props are the page's initial data: only public fields, and every text that must match to the
// character (an amount or a total as money) already formatted by the server — the browser formats nothing
// before it has hydrated, and nothing after it either. After hydration the category filter is client
// state: it changes which expenses are shown; the totals stay the server's texts.
import { createElement as h, useState } from "react";
import type { ReactElement } from "react";
import type { CategoryId } from "../domain/expenses.ts";

export type PublicExpense = { id: string; label: string; amountText: string; date: string; category: CategoryId };

// A total in minor units next to its text: the page shows only the text the server formatted.
export type PublicTotal = { category: CategoryId; totalMinor: number; totalText: string };

export type ListPageData = { requestId: string; expenses: PublicExpense[]; totals: PublicTotal[]; totalMinor: number; totalText: string };

export type CategoryFilter = CategoryId | "all";

const CATEGORIES: CategoryId[] = ["food", "transport", "home", "fun"];

const CATEGORY_NAMES: Record<CategoryId, string> = {
  food: "%%categoryFood%%",
  transport: "%%categoryTransport%%",
  home: "%%categoryHome%%",
  fun: "%%categoryFun%%",
};

function isCategoryFilter(value: string): value is CategoryFilter {
  return value === "all" || (CATEGORIES as string[]).includes(value);
}

// The expenses the filter shows: every one for "all", else those of the chosen category.
export function visibleExpenses(expenses: PublicExpense[], filter: CategoryFilter): PublicExpense[] {
  return filter === "all" ? expenses : expenses.filter((expense) => expense.category === filter);
}

export function ExpenseListPage({ initial }: { initial: ListPageData }): ReactElement {
  // The first render on both sides shows every expense: the server knows no filter.
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const shown = visibleExpenses(initial.expenses, filter);

  return h(
    "main",
    null,
    h("h1", null, "%%projectTitle%%"),
    h(
      "section",
      null,
      h("h2", null, "%%summaryTitle%%"),
      h(
        "dl",
        null,
        initial.totals.map((total) => h("div", { key: total.category }, h("dt", null, CATEGORY_NAMES[total.category]), h("dd", null, total.totalText))),
        h("div", null, h("dt", null, "%%totalLabel%%"), h("dd", null, initial.totalText)),
      ),
    ),
    h(
      "section",
      null,
      h("h2", null, "%%listTitle%%"),
      h(
        "label",
        null,
        "%%filterLabel%% ",
        h(
          "select",
          {
            value: filter,
            onChange: (event: { target: { value: string } }) => {
              const value = event.target.value;
              if (isCategoryFilter(value)) {
                setFilter(value);
              }
            },
          },
          h("option", { value: "all" }, "%%filterAll%%"),
          CATEGORIES.map((category) => h("option", { key: category, value: category }, CATEGORY_NAMES[category])),
        ),
      ),
      shown.length === 0
        ? h("p", null, "%%filterEmptyMessage%%")
        : h(
            "ul",
            null,
            shown.map((expense) =>
              h(
                "li",
                { key: expense.id, className: "card", "data-id": expense.id },
                h("h3", null, expense.label),
                h("p", null, `%%valueLabel%%: ${expense.amountText}`),
                h("p", null, `%%categoryFieldLabel%%: ${CATEGORY_NAMES[expense.category]} · %%dateFieldLabel%%: ${expense.date}`),
              ),
            ),
          ),
    ),
  );
}

// The element both sides render: the server with renderToString, the browser with hydrateRoot.
export function clientElement(data: ListPageData): ReactElement {
  return h(ExpenseListPage, { initial: data });
}
