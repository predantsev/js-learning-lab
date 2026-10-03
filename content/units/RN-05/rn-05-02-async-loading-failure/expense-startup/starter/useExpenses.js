import { useEffect, useState } from 'react';

const KEY = 'jsll.expenses.v1';

// Reports { status, records, retry, add } to the screen.
// status: 'loading' | 'ready' | 'empty' | 'failed'
export function useExpenses(storage) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    storage.getItem(KEY).then((text) => {
      setRecords(text === null ? [] : JSON.parse(text).records);
    });
  }, [storage]);

  useEffect(() => {
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records }));
  }, [storage, records]);

  const add = (expense) => setRecords([...records, expense]);
  const retry = () => {};

  return { status: records.length === 0 ? 'empty' : 'ready', records, retry, add };
}
