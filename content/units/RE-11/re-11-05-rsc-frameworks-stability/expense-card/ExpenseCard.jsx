import { useEffect, useState } from "react";
import { loadExpense } from "./data";

// A client component: loads its data in an effect, after the first render.
export default function ExpenseCard({ id }) {
  const [expense, setExpense] = useState(null);

  useEffect(() => {
    let ignore = false;
    loadExpense(id).then((loaded) => {
      if (!ignore) setExpense(loaded);
    });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (expense === null) return <p role="status">%%loading%%</p>;
  return <p>{`${expense.label}: ${(expense.amountMinor / 100).toFixed(2)} %%currency%%`}</p>;
}
