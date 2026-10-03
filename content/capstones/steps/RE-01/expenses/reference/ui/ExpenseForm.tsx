// The shell of the expense form: labels, fields and the Save button, but no state and no handlers
// yet, so the button stays disabled. The next step makes the form work.
export function ExpenseForm() {
  return (
    <form noValidate>
      <div className="field">
        <label htmlFor="expense-label">%%nameLabel%%</label>
        <input id="expense-label" name="label" />
      </div>
      <div className="field">
        <label htmlFor="expense-amount">%%valueLabel%%</label>
        <input id="expense-amount" name="amount" inputMode="decimal" />
      </div>
      <div className="field">
        <label htmlFor="expense-date">%%dateFieldLabel%%</label>
        <input id="expense-date" name="date" type="date" />
      </div>
      <div className="field">
        <label htmlFor="expense-category">%%categoryFieldLabel%%</label>
        <select id="expense-category" name="category">
          <option value="">%%chooseCategory%%</option>
          <option value="food">%%categoryFood%%</option>
          <option value="transport">%%categoryTransport%%</option>
          <option value="home">%%categoryHome%%</option>
          <option value="fun">%%categoryFun%%</option>
        </select>
      </div>
      <button type="submit" disabled>
        %%saveLabel%%
      </button>
      <p className="note">%%formShellNote%%</p>
    </form>
  );
}
