import { useEffect, useState } from "react";

async function saveExpense(expense) {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(expense),
  });
  return response.json();
}

export default function NewExpense() {
  const [label, setLabel] = useState("");

  // Saves the draft every time it changes.
  useEffect(() => {
    saveExpense({ label, amountMinor: 1500 });
  }, [label]);

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="expense-label">%%labelField%%</label>
      <input id="expense-label" value={label} onChange={(event) => setLabel(event.target.value)} />
      <button type="submit">%%save%%</button>
    </form>
  );
}
