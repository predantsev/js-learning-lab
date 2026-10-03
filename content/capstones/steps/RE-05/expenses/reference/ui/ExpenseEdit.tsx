// The edit screen: #/expenses/:id/edit. Save and Cancel replace this history entry with the expense's
// own page, so Back from there never returns into the finished form.
import { useParams, useNavigate } from "./router.tsx";
import { useExpensesData } from "./useExpenses.ts";
import { useHeadingFocus } from "./focus.ts";
import { ExpenseForm } from "./ExpenseForm.tsx";
import type { ExpenseFields } from "./expensesReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function ExpenseEdit() {
  const { id } = useParams();
  const { expenses, dispatch } = useExpensesData();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const expense = expenses.find((one) => one.id === id);
  if (expense === undefined) {
    return <NotFound />;
  }
  const expenseId = expense.id;
  const page = "/expenses/" + expenseId;

  function handleSave(fields: ExpenseFields) {
    dispatch({ type: "updated", id: expenseId, fields: fields });
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      {/* key: another expense in the address starts a new form from that expense's data. */}
      <ExpenseForm key={expense.id} expense={expense} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
