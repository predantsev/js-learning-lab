import { useEffect, useMemo, useRef, useState } from "react";
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
  // Position of the deleted row among the shown rows, until the next commit has put focus somewhere.
  const removedAt = useRef(null);

  function add(expense) {
    nextId.current += 1;
    setExpenses([{ ...expense, id: `e-${nextId.current}`, date: "2026-12-31" }, ...expenses]);
  }

  function remove(id) {
    removedAt.current = shown.findIndex((expense) => expense.id === id);
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  // After the commit the next row has moved into the deleted row's place.
  useEffect(() => {
    if (removedAt.current === null) return;
    const buttons = tableRef.current.querySelectorAll("button");
    const target = buttons[removedAt.current] ?? buttons[removedAt.current - 1] ?? headingRef.current;
    removedAt.current = null;
    target.focus();
  }, [expenses]);

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
                <button onClick={() => remove(expense.id)}>
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
