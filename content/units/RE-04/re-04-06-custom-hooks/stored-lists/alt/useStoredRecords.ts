import { useEffect, useState } from "react";
import { readRecords } from "./storage";
import type { StoredTask } from "./storage";

// useStoredRecords(key): the list stored under `key` (read once) and a setter that also stores it.
// Listens to "storage" events for `key` and stops listening on unmount. Each call has its own list.
export function useStoredRecords(key: string): [StoredTask[], (next: StoredTask[]) => void] {
  const [records, setRecords] = useState<StoredTask[]>(() => readRecords(key));

  // Storing happens in the setter, at the moment of the change.
  function save(next: StoredTask[]) {
    localStorage.setItem(key, JSON.stringify(next));
    setRecords(next);
  }

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) setRecords(readRecords(key));
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [key]);

  return [records, save];
}
