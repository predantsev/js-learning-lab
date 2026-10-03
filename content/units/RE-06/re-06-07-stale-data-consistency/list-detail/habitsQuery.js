import { useEffect, useState } from "react";

// One cached query: the habit list. Every component that calls useHabits() reads the same entry.
let entry = { data: null, stale: true };
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

export function invalidateHabits() {
  entry = { ...entry, stale: true };
  notify();
}

async function fetchHabits() {
  const response = await fetch("/api/habits");
  entry = { data: await response.json(), stale: false };
  notify();
}

let loading = null;

export function useHabits() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((version) => version + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  useEffect(() => {
    if (entry.stale && loading === null) {
      loading = fetchHabits().finally(() => {
        loading = null;
      });
    }
  });
  return entry.data;
}
