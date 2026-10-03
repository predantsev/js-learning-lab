import { useEffect, useRef, useState } from "react";
import { validateExpense, formatAmount } from "./expenses.js";
import { MESSAGES } from "./messages.js";

const FIELDS = ["label", "amount", "category"]; // in the order they appear in the form

export default function ExpenseEditor() {
  const [expenses, setExpenses] = useState([]);
  const [errors, setErrors] = useState({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const summaryRef = useRef(null);

  // TODO: after every failed submit, once the summary is on the screen, move focus to it

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateExpense(Object.fromEntries(new FormData(event.currentTarget)));
    if (result.ok) {
      setExpenses([...expenses, result.value]);
      setErrors({});
      event.currentTarget.reset();
    } else {
      setErrors(result.errors);
      setFailedSubmits(failedSubmits + 1);
    }
  }

  return (
    <section>
      <form noValidate onSubmit={handleSubmit}>
        <h1>%%newExpense%%</h1>
        {/* TODO: when there are errors, the summary #error-summary with its heading and links */}
        <p>
          <label htmlFor="expense-label">%%label%%</label> <input id="expense-label" name="label" />
        </p>
        {/* TODO: the message for label */}
        <p>
          <label htmlFor="expense-amount">%%amount%%</label> <input id="expense-amount" name="amount" inputMode="decimal" />
        </p>
        {/* TODO: the message for amount */}
        <p>
          <label htmlFor="expense-category">%%category%%</label>{" "}
          <select id="expense-category" name="category" defaultValue="">
            <option value="">%%pickCategory%%</option>
            <option value="food">%%food%%</option>
            <option value="transport">%%transport%%</option>
            <option value="home">%%home%%</option>
            <option value="fun">%%fun%%</option>
          </select>
        </p>
        {/* TODO: the message for category */}
        <button>%%save%%</button>
      </form>
      <h2>%%saved%%</h2>
      <ul>
        {expenses.map((expense, index) => (
          <li key={index}>
            {expense.label} — {formatAmount(expense.amountMinor)}
          </li>
        ))}
      </ul>
    </section>
  );
}
