import { useMemo, useRef, useState } from "react";
import { CATEGORIES, EXPENSES, summarizeExpenses } from "./expenses";

const PAGE_SIZE = 100;
const CATEGORY_NAMES = { food: "%%food%%", transport: "%%transport%%", home: "%%home%%", fun: "%%fun%%" };

function money(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} %%currency%%`;
}

function ExpenseSummary({ expenses }) {
  // Measured: about 70 ms per letter in the search field, although expenses did not change.
  const summary = useMemo(() => summarizeExpenses(expenses), [expenses]);
  return (
    <section aria-label="%%summary%%">
      <p>
        %%count%% {summary.count} · %%overall%% {money(summary.overall)}
      </p>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category}>
            {CATEGORY_NAMES[category]}: {money(summary.totals[category])}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddExpenseForm({ onAdd }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");

  function submit(event) {
    event.preventDefault();
    const amountMinor = Math.round(Number(amount) * 100);
    if (label.trim() === "" || !(amountMinor > 0)) return;
    onAdd({ label: label.trim(), amountMinor, category });
    setLabel("");
    setAmount("");
  }

  return (
    <form onSubmit={submit}>
      <label>
        %%labelField%% <input value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>{" "}
      <label>
        %%amountField%% <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>{" "}
      <label>
        %%categoryField%%{" "}
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_NAMES[option]}
            </option>
          ))}
        </select>
      </label>{" "}
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function ExpenseBook() {
  const [expenses, setExpenses] = useState(EXPENSES);
  const [query, setQuery] = useState("");
  const nextId = useRef(EXPENSES.length);
  const headingRef = useRef(null);
  const tableRef = useRef(null);

  function add(expense) {
    nextId.current += 1;
    setExpenses([{ ...expense, id: `e-${nextId.current}`, date: "2026-12-31" }, ...expenses]);
  }

  function remove(id) {
    // The neighbours' buttons and the heading are already in the DOM: focus them before the commit.
    const buttons = [...tableRef.current.querySelectorAll("button")];
    const index = buttons.findIndex((button) => button.dataset.id === id);
    const target = buttons[index + 1] ?? buttons[index - 1] ?? headingRef.current;
    target.focus();
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  const matches = expenses.filter((expense) => expense.label.toLowerCase().includes(query.trim().toLowerCase()));
  const shown = matches.slice(0, PAGE_SIZE);

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        %%heading%%
      </h1>
      <ExpenseSummary expenses={expenses} />
      <AddExpenseForm onAdd={add} />
      <label>
        %%search%% <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p>
        %%showing%% {shown.length} / {matches.length}
      </p>
      <table ref={tableRef}>
        <tbody>
          {shown.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.label}</td>
              <td>{money(expense.amountMinor)}</td>
              <td>
                <button data-id={expense.id} onClick={() => remove(expense.id)}>
                  %%remove%%
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
