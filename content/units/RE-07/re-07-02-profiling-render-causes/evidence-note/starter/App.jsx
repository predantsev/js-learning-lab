import { useState } from "react";
import { CATEGORIES, EXPENSES } from "./expenses";
import { Measure } from "./profile";

function formatMoney(amountMinor) {
  return new Intl.NumberFormat("%%locale%%", { style: "currency", currency: "UAH" }).format(amountMinor / 100);
}

function NoteField({ value, onChange }) {
  return (
    <label>
      %%note%% <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

// Totals per category: for every category, a pass over all expenses.
function CategoryTotals({ expenses }) {
  const totals = CATEGORIES.map((category) => {
    let sum = 0;
    for (const expense of expenses) {
      if (expense.category === category) sum += expense.amountMinor;
    }
    return { category, sum };
  });
  return (
    <ul>
      {totals.map((total) => (
        <li key={total.category}>
          {total.category}: {formatMoney(total.sum)}
        </li>
      ))}
    </ul>
  );
}

function ExpenseRow({ expense }) {
  return (
    <tr>
      <td>{expense.label}</td>
      <td>{formatMoney(expense.amountMinor)}</td>
    </tr>
  );
}

function ExpenseTable({ expenses }) {
  return (
    <table>
      <tbody>
        {expenses.map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} />
        ))}
      </tbody>
    </table>
  );
}

export default function ExpensePage() {
  const [note, setNote] = useState("");

  return (
    <main>
      <Measure id="NoteField">
        <NoteField value={note} onChange={setNote} />
      </Measure>
      <Measure id="CategoryTotals">
        <CategoryTotals expenses={EXPENSES} />
      </Measure>
      <Measure id="ExpenseTable">
        <ExpenseTable expenses={EXPENSES} />
      </Measure>
    </main>
  );
}
