// The shell of the habit form: labels, fields and the Save button, but no state and no handlers yet,
// so the button stays disabled. The next step makes the form work.
export function HabitForm() {
  return (
    <form noValidate>
      <div className="field">
        <label htmlFor="habit-name">%%nameLabel%%</label>
        <input id="habit-name" name="name" />
      </div>
      <div className="field">
        <label htmlFor="habit-frequency">%%valueLabel%%</label>
        <select id="habit-frequency" name="frequency">
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>
      </div>
      <div className="field field-check">
        {/* defaultChecked: the box starts ticked (React's form of the HTML `checked`). */}
        <input id="habit-active" name="active" type="checkbox" defaultChecked />
        <label htmlFor="habit-active">%%activeFieldLabel%%</label>
      </div>
      <button type="submit" disabled>
        %%saveLabel%%
      </button>
      <p className="note">%%formShellNote%%</p>
    </form>
  );
}
