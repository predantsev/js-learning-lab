import { useState } from "react";
import ExpenseList from "./ExpenseList";
import { useExpenses } from "./expensesQuery.js";

function ExpenseDetail({ id, onBack }) {
  const { data } = useExpenses();
  const expense = data?.find((item) => item.id === id);
  return (
    <section>
      <button onClick={onBack}>%%back%%</button>
      {expense && (
        <h2>
          {expense.label} — {(expense.amountMinor / 100).toFixed(2)}
        </h2>
      )}
    </section>
  );
}

// A minimal "router": the list screen or one expense's screen, never both.
export default function Expenses() {
  const [openId, setOpenId] = useState(null);
  return openId === null ? (
    <ExpenseList onOpen={setOpenId} />
  ) : (
    <ExpenseDetail id={openId} onBack={() => setOpenId(null)} />
  );
}
