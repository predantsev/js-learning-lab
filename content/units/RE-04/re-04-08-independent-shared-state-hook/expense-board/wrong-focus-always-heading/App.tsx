import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { STORAGE_KEY, formatAmount, nextExpenseId, toMinor } from "./expenses";
import type { Expense } from "./expenses";
import { countRender } from "./renders.js";
import { useExpenses } from "./useExpenses";

function ExpenseList({ expenses, selectedId, onSelect, onRemove }: {
  expenses: Expense[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  countRender("ExpenseList");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Where focus goes after the next commit: an expense id, "heading", or null for nowhere.
  const focusAfterRemove = useRef<string | null>(null);

  function remove(id: string) {
    const index = expenses.findIndex((expense) => expense.id === id);
    const next = expenses[index + 1];
    focusAfterRemove.current = "heading";
    onRemove(id);
  }

  // The next expense's button exists before and after the commit, but the removed row is gone
  // only after it, so focus is moved here, once React has updated the DOM.
  useEffect(() => {
    const target = focusAfterRemove.current;
    focusAfterRemove.current = null;
    if (target === "heading") headingRef.current?.focus();
    else if (target !== null) listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${target}"]`)?.focus();
  }, [expenses]);

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%heading%%
      </h2>
      <ul ref={listRef}>
        {expenses.map((expense) => (
          <li key={expense.id}>
            <button data-id={expense.id} aria-pressed={expense.id === selectedId} onClick={() => onSelect(expense.id)}>
              {expense.label} — {formatAmount(expense.amountMinor)}
            </button>{" "}
            <button onClick={() => remove(expense.id)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExpenseDetail({ expense }: { expense: Expense | null }) {
  countRender("ExpenseDetail");
  return (
    <aside>
      {expense === null ? (
        <p>%%pick%%</p>
      ) : (
        <p>
          <strong>{expense.label}</strong> — {formatAmount(expense.amountMinor)}
        </p>
      )}
    </aside>
  );
}

function Summary({ expenses }: { expenses: Expense[] }) {
  countRender("Summary");
  const total = expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
  return (
    <p data-total>
      %%total%% {formatAmount(total)}
    </p>
  );
}

function AddExpenseForm({ onAdd }: { onAdd: (expense: Expense) => void }) {
  countRender("AddExpenseForm");
  // The draft is needed only here.
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = toMinor(amount);
    if (label.trim() === "" || amountMinor === null) return;
    onAdd({ id: nextExpenseId(), label: label.trim(), amountMinor: amountMinor });
    setLabel("");
    setAmount("");
    // The field exists all the time, so the handler can focus it at once.
    labelRef.current?.focus();
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%labelField%% <input ref={labelRef} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label>
        %%amountField%% <input value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function ExpenseApp() {
  countRender("ExpenseApp");
  const [state, dispatch] = useExpenses(STORAGE_KEY);
  const selected = state.expenses.find((expense) => expense.id === state.selectedId) ?? null;

  return (
    <main>
      <ExpenseList
        expenses={state.expenses}
        selectedId={state.selectedId}
        onSelect={(id) => dispatch({ type: "selected", id: id })}
        onRemove={(id) => dispatch({ type: "removed", id: id })}
      />
      <ExpenseDetail expense={selected} />
      <Summary expenses={state.expenses} />
      <AddExpenseForm onAdd={(expense) => dispatch({ type: "added", expense: expense })} />
    </main>
  );
}
