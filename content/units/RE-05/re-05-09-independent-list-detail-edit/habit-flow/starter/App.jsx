import { useState } from "react";
import { Router, Routes, createMemoryHistory } from "./router";
import { HistoryPanel } from "./HistoryPanel";

const routes = [];

export default function App({ initialPath = "/habits" }) {
  const [history] = useState(() => createMemoryHistory(initialPath));
  return (
    <Router history={history}>
      <HistoryPanel />
      <Routes routes={routes} />
    </Router>
  );
}
