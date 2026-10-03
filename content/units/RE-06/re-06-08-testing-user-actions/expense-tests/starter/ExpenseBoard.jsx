import { useEffect, useState } from "react";

const formatAmount = (amountMinor) => (amountMinor / 100).toFixed(2);

async function createExpense(expense) {
  try {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(expense),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default function ExpenseBoard() {
  const [expenses, setExpenses] = useState(null);
  const [round, setRound] = useState(0); // every new value reads the list again
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "saving" | "saved" | "failed"

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/expenses", { signal: controller.signal })
      .then((response) => response.json())
      .then(setExpenses)
      .catch((error) => {
        if (error.name !== "AbortError") throw error;
      });
    return () => controller.abort();
  }, [round]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("saving");
    const saved = await createExpense({ label, amountMinor: Math.round(Number(amount) * 100) });
    if (saved) {
      setLabel("");
      setAmount("");
      setStatus("saved");
      setRound((current) => current + 1);
    } else {
      setStatus("failed");
    }
  }

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label htmlFor="expense-label">%%labelField%%</label>
        <input id="expense-label" value={label} onChange={(event) => setLabel(event.target.value)} />
        <label htmlFor="expense-amount">%%amountField%%</label>
        <input id="expense-amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <button type="submit" disabled={status === "saving"}>
          %%save%%
        </button>
      </form>
      <p role="status">{status === "saved" ? "%%saved%%" : ""}</p>
      <p role="alert">{status === "failed" ? "%%saveFailed%%" : ""}</p>
      {expenses === null ? (
        <p>%%loading%%</p>
      ) : (
        <ul aria-label="%%listName%%">
          {expenses.map((expense) => (
            <li key={expense.id}>
              {expense.label} — {formatAmount(expense.amountMinor)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
