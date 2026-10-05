import { useEffect, useState } from "react";

// One cached query: the expense list. The entry keeps the data, the time the server answered
// (`updatedAt`) and whether it is stale. Every component that calls useExpenses() reads it.
let entry = { data: null, updatedAt: null, stale: true };
let loading = null;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

// Marks the list as stale: whoever shows it fetches it again and keeps the old data meanwhile.
export function invalidateExpenses() {
  entry = { ...entry, stale: true };
  notify();
}

export function resetExpensesQuery() {
  entry = { data: null, updatedAt: null, stale: true };
}

async function fetchExpenses() {
  const response = await fetch("/api/expenses");
  const body = await response.json();
  entry = { data: body.items, updatedAt: body.servedAt, stale: false };
  notify();
}

export function useExpenses() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((version) => version + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  // After every render: a stale entry is fetched, one request at a time.
  useEffect(() => {
    if (entry.stale && loading === null) {
      loading = fetchExpenses().finally(() => {
        loading = null;
      });
    }
  });
  return entry;
}
