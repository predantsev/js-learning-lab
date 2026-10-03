import { useState } from "react";
import { ExpenseList } from "./ExpenseList";

export default function App() {
  const [query, setQuery] = useState("");

  // TODO: keep the field's text urgent, run the list's query in a transition,
  // and dim the results while the transition is pending.
  function handleChange(event) {
    setQuery(event.target.value);
  }

  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <label>
        %%searchLabel%% <input value={query} onChange={handleChange} />
      </label>
      <div>
        <ExpenseList query={query} />
      </div>
    </div>
  );
}
