import { useState, useTransition } from "react";
import { ExpenseList } from "./ExpenseList";

export default function App() {
  const [text, setText] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [isPending] = useTransition();

  function handleChange(event) {
    setText(event.target.value);
    setListQuery(event.target.value);
  }

  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <label>
        %%searchLabel%% <input value={text} onChange={handleChange} />
      </label>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <ExpenseList query={listQuery} />
      </div>
    </div>
  );
}
