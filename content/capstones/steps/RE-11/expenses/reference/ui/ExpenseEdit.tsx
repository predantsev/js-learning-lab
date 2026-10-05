// The edit screen: #/expenses/:id/edit. The expense comes from the cached list of all expenses. Save waits for
// the API: on success it replaces this history entry with the expense's own page (Back never returns
// into the finished form); on an error the draft stays and the message says why.
import { useState } from "react";
import { useParams, useNavigate } from "./router.tsx";
import { useExpensesList, useExpenseMutations } from "./expensesCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { ExpenseForm } from "./ExpenseForm.tsx";
import type { ExpenseFields } from "./expensesReducer.ts";
import { NotFound } from "./NotFound.tsx";

export function ExpenseEdit() {
  const { id } = useParams();
  const all = useExpensesList("all");
  const mutations = useExpenseMutations();
  const navigate = useNavigate();
  const headingRef = useHeadingFocus("%%editTitle%%");
  const [notice, setNotice] = useState("");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const expense = all.items.find((one) => one.id === id);
  if (expense === undefined) {
    return <NotFound />;
  }
  const expenseId = expense.id;
  const page = "/expenses/" + expenseId;

  async function handleSave(fields: ExpenseFields): Promise<boolean> {
    const result = await mutations.save(expenseId, fields);
    if (!result.ok) {
      setNotice(result.message);
      return false;
    }
    // The draft is saved, so this navigation needs no question.
    navigate(page, { replace: true, skipGuard: true });
    return true;
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%editTitle%%
      </h2>
      <p role="status">{notice}</p>
      {/* key: another expense in the address starts a new form from that expense's data. */}
      <ExpenseForm key={expense.id} expense={expense} onSave={handleSave} onCancel={() => navigate(page, { replace: true })} />
    </section>
  );
}
