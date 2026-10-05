// One expense: #/expenses/:id. The id from the address is only text: it is looked up in the list, and
// an id that no expense has shows the not-found screen.
import { useParams, Link } from "./router.tsx";
import { useExpensesData } from "./useExpenses.ts";
import { useHeadingFocus } from "./focus.ts";
import { categoryText } from "../domain/expenses.ts";
import { formatMoney, formatDay, LOCALE } from "./format.js";
import { NotFound } from "./NotFound.tsx";

export function ExpenseDetail() {
  const { id } = useParams();
  const { expenses } = useExpensesData();
  const expense = expenses.find((one) => one.id === id);
  const headingRef = useHeadingFocus(expense?.label ?? "%%notFoundTitle%%");
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
