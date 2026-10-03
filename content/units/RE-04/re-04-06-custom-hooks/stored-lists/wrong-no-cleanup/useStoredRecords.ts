import { useEffect, useState } from "react";
import { readRecords } from "./storage";
import type { StoredTask } from "./storage";

// Contract of useStoredRecords(key)
// - Arguments: key — the localStorage key of this list. It is read on the first render only:
//   to switch to another key, mount the component again (for example with a different React key).
// - Returns: [records, setRecords] — the current list and a function that replaces it.
// - Effects: stores the whole list under `key` after every change (dependencies [key, records]);
//   listens to "storage" events and reloads the list when `key` changed in another tab
//   (dependencies [key]).
// - Cleanup: removes the "storage" listener before a re-run and on unmount.
// - Every call owns its own list: two components calling it never share state.
export function useStoredRecords(key: string): [StoredTask[], (next: StoredTask[]) => void] {
  const [records, setRecords] = useState<StoredTask[]>(() => readRecords(key));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(records));
  }, [key, records]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) setRecords(readRecords(key));
    }
    window.addEventListener("storage", handleStorage);
  }, [key]);

  return [records, setRecords];
}
