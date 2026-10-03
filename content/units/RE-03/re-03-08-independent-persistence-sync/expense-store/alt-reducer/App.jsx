import { useEffect, useReducer, useState } from "react";
import { CATEGORIES, DEFAULT_EXPENSES, STORAGE_KEY, TODAY, formatAmount, parseAmount, summarizeExpenses, validateExpense } from "./expenses.js";

// Reads the stored list once; anything unusable falls back to the defaults.
function readStoredExpenses() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_EXPENSES;
  }
  if (stored === null || typeof stored !== "object" || stored.schemaVersion !== 1 || !Array.isArray(stored.records)) {
    return DEFAULT_EXPENSES;
  }
  return stored.records.map(validateExpense).filter((result) => result.ok).map((result) => result.value);
}

// Every change of the list is an action; the reducer returns the next list.
function expensesReducer(expenses, action) {
  if (action.type === "added") return [...expenses, action.expense];
  if (action.type === "removed") return expenses.filter((expense) => expense.id !== action.id);
  return expenses;
}

export default function ExpenseTracker() {
  const [expenses, dispatch] = useReducer(expensesReducer, null, readStoredExpenses);
  const [draft, setDraft] = useState({ label: "", amount: "", category: "food" });
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records: expenses }));
  }, [expenses]);

  const { totalMinor } = summarizeExpenses(expenses);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateExpense({
      id: `e-${Date.now()}-${expenses.length}`,
      label: draft.label,
      amountMinor: parseAmount(draft.amount),
      date: TODAY,
      category: draft.category,
    });
    if (!result.ok) {
      setInvalid(true);
      return;
    }
    dispatch({ type: "added", expense: result.value });
    setDraft({ label: "", amount: "", category: draft.category });
    setInvalid(false);
  }

  function remove(id) {
    dispatch({ type: "removed", id });
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <form onSubmit={handleSubmit}>
        <label>
          %%labelField%% <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
        </label>
        <label>
          %%amountField%% <input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />
        </label>
        <label>
          %%categoryField%%{" "}
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">%%add%%</button>
        {invalid && <p role="alert">%%invalid%%</p>}
      </form>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            <span>{expense.label}</span> — {formatAmount(expense.amountMinor)}{" "}
            <button type="button" onClick={() => remove(expense.id)}>
              %%remove%%
            </button>
          </li>
        ))}
      </ul>
      <p data-total>
        %%total%% {formatAmount(totalMinor)}
      </p>
    </section>
  );
}
