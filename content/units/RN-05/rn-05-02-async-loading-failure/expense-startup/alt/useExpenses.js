import { useCallback, useEffect, useState } from 'react';

const KEY = 'jsll.expenses.v1';

// Another approach: async/await in the load, and the save happens in the event handler,
// so nothing can be written before the user changes something after a successful load.
export function useExpenses(storage) {
  const [status, setStatus] = useState('loading');
  const [records, setRecords] = useState([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const text = await storage.getItem(KEY);
      const loaded = text === null ? [] : JSON.parse(text).records;
      setRecords(loaded);
      setStatus(loaded.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('failed');
    }
  }, [storage]);

  useEffect(() => {
    load();
  }, [load]);

  const add = (expense) => {
    const next = [...records, expense];
    setRecords(next);
    setStatus('ready');
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: next }));
  };

  return { status, records, retry: load, add };
}
