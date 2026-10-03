import { useEffect, useState } from "react";
import { readRecords } from "./storage";
import type { StoredTask } from "./storage";

// "One list for everybody": kept outside the hook, so every call sees the same array.
let shared: StoredTask[] | null = null;

export function useStoredRecords(key: string): [StoredTask[], (next: StoredTask[]) => void] {
  const [records, setRecords] = useState<StoredTask[]>(() => shared ?? readRecords(key));

  function save(next: StoredTask[]) {
    shared = next;
    setRecords(next);
  }

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(records));
  }, [key, records]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === key) setRecords(readRecords(key));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  return [records, save];
}
