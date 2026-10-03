import { useState } from "react";
import { validateExpense } from "./expenses.js";
import { MESSAGES } from "./messages.js";
import { FocusReport } from "./FocusReport";

export default function ExpenseForm() {
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateExpense(Object.fromEntries(new FormData(event.currentTarget)));
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) console.log("%%saved%%", result.value);
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit}>
        <h1>%%editExpense%%</h1>
        <p>
          <label htmlFor="edit-label">%%label%%</label> <input id="edit-label" name="label" defaultValue="%%groceries%%" />
        </p>
        <p>
          <label htmlFor="edit-amount">%%amount%%</label> <input id="edit-amount" name="amount" defaultValue="0" />
        </p>
        {errors.amount && (
          <p id="edit-amount-error" style={{ color: "firebrick" }}>
            {MESSAGES[errors.amount]}
          </p>
        )}
        <p>
          <label htmlFor="edit-category">%%category%%</label>{" "}
          <select id="edit-category" name="category" defaultValue="food">
            <option value="">%%pickCategory%%</option>
            <option value="food">%%food%%</option>
            <option value="fun">%%fun%%</option>
          </select>
        </p>
        <button>%%save%%</button>
      </form>
      <FocusReport />
    </>
  );
}
