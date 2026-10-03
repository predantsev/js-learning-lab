import { useState } from "react";
import { ReadingList } from "./ReadingList";
import { ReadingListProvider } from "./ReadingListContext";

export default function App() {
  const [compact, setCompact] = useState(false);
  return (
    <ReadingListProvider>
      <main style={{ lineHeight: compact ? 1.2 : 1.6 }}>
        <h1>%%heading%%</h1>
        <label>
          <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} /> %%compact%%
        </label>
        <ReadingList />
      </main>
    </ReadingListProvider>
  );
}
