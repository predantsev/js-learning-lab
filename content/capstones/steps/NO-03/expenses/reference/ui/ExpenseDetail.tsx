// One expense: #/expenses/:id. The id from the address is only text: it is looked up in the cached list of
// all expenses (one source for every screen, read again when this screen opens), and an id that no
// expense has shows the not-found screen.
import { useParams, Link } from "./router.tsx";
import { useExpensesList } from "./expensesCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { categoryText } from "../domain/expenses.ts";
import { formatMoney, formatDay, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";

export function ExpenseDetail() {
  const { id } = useParams();
  const all = useExpensesList("all");
  const expense = all.items?.find((one) => one.id === id);
  const headingRef = useHeadingFocus(expense?.label ?? "%%notFoundTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  if (expense === undefined) {
    return <NotFound />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        {expense.label}
      </h2>
      <p>%%valueLabel%%: {formatMoney(expense.amountMinor, LOCALE)}</p>
      <p>%%dateFieldLabel%%: {formatDay(expense.date, LOCALE)}</p>
      <p>%%categoryFieldLabel%%: {categoryText(expense.category)}</p>
      <p>
        <Link to={"/expenses/" + expense.id + "/edit"}>%%editLabel%%</Link> · <Link to="/expenses">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
