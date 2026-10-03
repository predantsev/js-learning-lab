// The shell of the task form: labels, fields and the Save button, but no state and no handlers yet,
// so the button stays disabled. The next step makes the form work.
export function TaskForm() {
  return (
    <form noValidate>
      <div className="field">
        <label htmlFor="task-title">%%nameLabel%%</label>
        <input id="task-title" name="title" />
      </div>
      <div className="field">
        <label htmlFor="task-due-date">%%valueLabel%%</label>
        <input id="task-due-date" name="dueDate" type="date" />
      </div>
      <div className="field">
        <label htmlFor="task-priority">%%priorityFieldLabel%%</label>
        {/* defaultValue: the option the list starts with (React's form of the HTML `selected`). */}
        <select id="task-priority" name="priority" defaultValue="normal">
          <option value="low">%%priorityLow%%</option>
          <option value="normal">%%priorityNormal%%</option>
          <option value="high">%%priorityHigh%%</option>
        </select>
      </div>
      <div className="field field-check">
        <input id="task-done" name="done" type="checkbox" />
        <label htmlFor="task-done">%%doneFieldLabel%%</label>
      </div>
      <button type="submit" disabled>
        %%saveLabel%%
      </button>
      <p className="note">%%formShellNote%%</p>
    </form>
  );
}
