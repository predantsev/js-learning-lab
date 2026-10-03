import { useEffect, useRef, useState } from "react";
import { validateExpense, formatAmount } from "./expenses.js";
import { MESSAGES } from "./messages.js";

const FIELDS = ["label", "amount", "category"]; // in the order they appear in the form

function invalidProps(field, errors) {
  if (!errors[field]) return {};
  return { "aria-invalid": "true", "aria-describedby": `expense-${field}-error` };
}

function FieldError({ field, errors }) {
  if (!errors[field]) return null;
  return <p id={`expense-${field}-error`}>{MESSAGES[errors[field]]}</p>;
}

export default function ExpenseEditor() {
  const [expenses, setExpenses] = useState([]);
  const [errors, setErrors] = useState({});
  const [failedSubmits, setFailedSubmits] = useState(0);
  const summaryRef = useRef(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) summaryRef.current.focus();
  }, [errors]);

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
          <section id="error-summary" tabIndex={-1} ref={summaryRef} aria-labelledby="error-summary-title">
            <h2 id="error-summary-title">%%summaryTitle%%</h2>
            <ul>
              {FIELDS.map((field) =>
                errors[field] ? (
                  <li key={field}>
                    <a href={"#expense-" + field}>{MESSAGES[errors[field]]}</a>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}
        <p>
          <label htmlFor="expense-label">%%label%%</label> <input id="expense-label" {...invalidProps("label", errors)} name="label" />
        </p>
        <FieldError field="label" errors={errors} />
        <p>
          <label htmlFor="expense-amount">%%amount%%</label> <input id="expense-amount" {...invalidProps("amount", errors)} name="amount" inputMode="decimal" />
        </p>
        <FieldError field="amount" errors={errors} />
        <p>
          <label htmlFor="expense-category">%%category%%</label>{" "}
          <select id="expense-category" {...invalidProps("category", errors)} name="category" defaultValue="">
            <option value="">%%pickCategory%%</option>
            <option value="food">%%food%%</option>
            <option value="transport">%%transport%%</option>
            <option value="home">%%home%%</option>
            <option value="fun">%%fun%%</option>
          </select>
        </p>
        <FieldError field="category" errors={errors} />
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
