import { useState, useTransition } from "react";
import { WishList } from "./WishList";

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [onlyWanted, setOnlyWanted] = useState(false);
  const [, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.target.value;
    setText(value);
    startTransition(() => setQuery(value));
  }

  return (
    <div>
      <h1>%%wishesTitle%%</h1>
      <label>
        %%searchLabel%% <input value={text} onChange={handleChange} />
      </label>{" "}
      <label>
        <input type="checkbox" checked={onlyWanted} onChange={(event) => setOnlyWanted(event.target.checked)} /> %%onlyWanted%%
      </label>
      <WishList query={query} onlyWanted={onlyWanted} />
    </div>
  );
}
