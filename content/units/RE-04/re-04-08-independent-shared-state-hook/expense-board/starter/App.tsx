import { useState } from "react";
import type { SubmitEvent } from "react";
import { START_EXPENSES, formatAmount, nextExpenseId, toMinor } from "./expenses";
import type { Expense } from "./expenses";
import { countRender } from "./renders.js";

function ExpenseList({ expenses, selectedId, onSelect, onRemove }: {
  expenses: Expense[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  countRender("ExpenseList");
  return (
    <section>
      <h2 tabIndex={-1}>%%heading%%</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            <button data-id={expense.id} aria-pressed={expense.id === selectedId} onClick={() => onSelect(expense.id)}>
              {expense.label} — {formatAmount(expense.amountMinor)}
            </button>{" "}
            <button onClick={() => onRemove(expense.id)}>%%remove%%</button>
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

function AddExpenseForm({ label, amount, onLabelChange, onAmountChange, onAdd }: {
  label: string;
  amount: string;
  onLabelChange: (text: string) => void;
  onAmountChange: (text: string) => void;
  onAdd: () => void;
}) {
  countRender("AddExpenseForm");
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd();
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%labelField%% <input value={label} onChange={(event) => onLabelChange(event.target.value)} />
      </label>
      <label>
        %%amountField%% <input value={amount} onChange={(event) => onAmountChange(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function ExpenseApp() {
  countRender("ExpenseApp");
  const [expenses, setExpenses] = useState<Expense[]>(START_EXPENSES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  function add() {
    const amountMinor = toMinor(amount);
    if (label.trim() === "" || amountMinor === null) return;
    setExpenses([...expenses, { id: nextExpenseId(), label: label.trim(), amountMinor: amountMinor }]);
    setLabel("");
    setAmount("");
  }

  function remove(id: string) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const selected = expenses.find((expense) => expense.id === selectedId) ?? null;

  return (
    <main>
      <ExpenseList expenses={expenses} selectedId={selectedId} onSelect={setSelectedId} onRemove={remove} />
      <ExpenseDetail expense={selected} />
      <Summary expenses={expenses} />
      <AddExpenseForm label={label} amount={amount} onLabelChange={setLabel} onAmountChange={setAmount} onAdd={add} />
    </main>
  );
}
