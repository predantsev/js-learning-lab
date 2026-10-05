import { useState } from "react";
import { syncNow } from "./sync";

export default function SyncStatus() {
  const [status, setStatus] = useState(navigator.onLine ? "%%online%%" : "%%offline%%");

  async function handleClick() {
    setStatus(await syncNow());
  }

  return (
    <header>
      <h1>%%title%%</h1>
      <p>
        %%sync%%: <span>{status}</span>
      </p>
      <button onClick={handleClick}>%%syncNow%%</button>
    </header>
  );
}
