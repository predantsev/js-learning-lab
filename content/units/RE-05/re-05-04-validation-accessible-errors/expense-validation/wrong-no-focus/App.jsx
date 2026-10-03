import { useEffect, useRef, useState } from "react";
import { validateExpense, formatAmount } from "./expenses.js";
import { MESSAGES } from "./messages.js";

const FIELDS = ["label", "amount", "category"]; // in the order they appear in the form

export default function ExpenseEditor() {
  const [expenses, setExpenses] = useState([]);
  const [errors, setErrors] = useState({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const summaryRef = useRef(null);


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
        {Object.keys(errors).length > 0 && (
          <div id="error-summary" tabIndex={-1} ref={summaryRef}>
            <h2>%%summaryTitle%%</h2>
            <ul>
              {FIELDS.filter((field) => errors[field]).map((field) => (
                <li key={field}>
                  <a href={`#expense-${field}`}>{MESSAGES[errors[field]]}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>
          <label htmlFor="expense-label">%%label%%</label> <input id="expense-label" name="label" aria-invalid={errors.label ? "true" : undefined} aria-describedby={errors.label ? "expense-label-error" : undefined} />
        </p>
        {errors.label && <p id="expense-label-error">{MESSAGES[errors.label]}</p>}
        <p>
          <label htmlFor="expense-amount">%%amount%%</label> <input id="expense-amount" name="amount" inputMode="decimal" aria-invalid={errors.amount ? "true" : undefined} aria-describedby={errors.amount ? "expense-amount-error" : undefined} />
        </p>
        {errors.amount && <p id="expense-amount-error">{MESSAGES[errors.amount]}</p>}
        <p>
          <label htmlFor="expense-category">%%category%%</label>{" "}
          <select id="expense-category" name="category" defaultValue="" aria-invalid={errors.category ? "true" : undefined} aria-describedby={errors.category ? "expense-category-error" : undefined}>
            <option value="">%%pickCategory%%</option>
            <option value="food">%%food%%</option>
            <option value="transport">%%transport%%</option>
            <option value="home">%%home%%</option>
            <option value="fun">%%fun%%</option>
          </select>
        </p>
        {errors.category && <p id="expense-category-error">{MESSAGES[errors.category]}</p>}
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
