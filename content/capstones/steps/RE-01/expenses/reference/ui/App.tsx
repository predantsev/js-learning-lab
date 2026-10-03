// The whole page as a tree of components: App → Section → ExpenseForm and Section → ExpenseList → one ExpenseCard per
// expense. The numbers come from the pure domain functions, which stay exactly as they were.
import { totalsByCategory, totalOf, categoryText } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";
import { ExpenseForm } from "./ExpenseForm.tsx";
import { ExpenseList } from "./ExpenseList.tsx";
import { Section } from "./Section.tsx";

type AppProps = { expenses: Expense[] };

export function App({ expenses }: AppProps) {
  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = [...totalsByCategory(expenses)].map(([category, sum]) => categoryText(category) + ": " + formatMoney(sum, LOCALE));
  parts.push("%%totalLabel%%: " + formatMoney(totalOf(expenses), LOCALE));
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/expense.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        <ExpenseForm />
      </Section>
      <p>{parts.join(" · ")}</p>
      <Section title="%%listTitle%%">
        <ExpenseList expenses={expenses} />
      </Section>
    </main>
  );
}
