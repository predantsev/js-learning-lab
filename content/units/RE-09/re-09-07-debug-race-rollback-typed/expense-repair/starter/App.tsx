// The expense screen with timeline controls. Read-only.
import { useEffect, useReducer, useRef } from "react";
import { expensesReducer } from "./expensesReducer";
import { loadExpenses, saveAmount } from "./api";
import type { ExpensesAction, ExpensesState } from "./expenses";

const money = (minor: number) => `${(minor / 100).toFixed(2)} %%uah%%`;

// Prints every transition: the statuses and the fields of the next state.
function loggedReducer(state: ExpensesState, action: ExpensesAction): ExpensesState {
  const next = expensesReducer(state, action);
  const amounts = next.status === "ready" ? " " + next.expenses.map((e) => `${e.id}=${e.amountMinor}`).join(" ") : "";
  console.log(`${state.status} + ${action.type} → ${next.status} {${Object.keys(next).join(", ")}}${amounts}`);
  return next;
}

export function ExpenseScreen() {
  const [state, dispatch] = useReducer(loggedReducer, { status: "loading" });
  const mutation = useRef(0);

  useEffect(() => {
    let ignore = false;
    loadExpenses().then((result) => {
      if (ignore) return;
      if (result.ok) dispatch({ type: "loaded", expenses: result.value });
      else dispatch({ type: "loadFailed", message: Object.keys(result.errors).join(", ") });
    });
    return () => {
      ignore = true;
    };
  }, []);

  // An optimistic edit: show the new amount at once, confirm it or roll it back when the server answers.
  async function edit(id: string, amountMinor: number, delayMs: number, fail: boolean) {
    if (state.status !== "ready") return;
    const previousAmount = state.expenses.find((expense) => expense.id === id)?.amountMinor ?? 0;
    mutation.current += 1;
    const current = mutation.current;
    dispatch({ type: "editStarted", id, amountMinor, mutation: current });
    try {
      await saveAmount(id, amountMinor, delayMs, fail);
      dispatch({ type: "editConfirmed", id, mutation: current });
    } catch {
      dispatch({ type: "editFailed", id, mutation: current, previousAmount });
    }
  }

  if (state.status === "loading") return <p role="status">%%loading%%</p>;
  if (state.status === "failed") return <p role="alert">%%loadFailed%% {state.message}</p>;
  return (
    <section>
      <ul>
        {state.expenses.map((expense) => (
          <li key={expense.id} data-id={expense.id}>
            {expense.date.slice(5)} · {expense.label} — {money(expense.amountMinor)}
          </li>
        ))}
      </ul>
      <p>
        <button onClick={() => edit("e-01", 90000, 300, true)}>%%editA%%</button>{" "}
        <button onClick={() => edit("e-01", 95000, 100, false)}>%%editB%%</button>{" "}
        <button onClick={() => dispatch({ type: "loadFailed", message: "%%lateFailure%%" })}>%%late%%</button>
      </p>
    </section>
  );
}
