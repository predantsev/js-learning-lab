import { useState } from "react";
import { SyncStatus } from "./SyncStatus";

export default function App() {
  const [shown, setShown] = useState(true);
  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <button onClick={() => setShown(!shown)}>{shown ? "%%hideStatus%%" : "%%showStatus%%"}</button>
      {shown && <SyncStatus />}
    </div>
  );
}
