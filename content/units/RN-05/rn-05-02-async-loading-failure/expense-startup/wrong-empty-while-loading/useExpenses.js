import { useEffect, useState } from 'react';

const KEY = 'jsll.expenses.v1';

// Mistake: there is no loading state — an empty list stands for "not loaded yet".
export function useExpenses(storage) {
  const [state, setState] = useState({ status: 'empty', records: [] });
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    storage.getItem(KEY).then(
      (text) => {
        if (!active) return;
        const records = text === null ? [] : JSON.parse(text).records;
        setState({ status: records.length === 0 ? 'empty' : 'ready', records });
        setLoaded(true);
      },
      () => {
        if (active) setState({ status: 'failed', records: [] });
      },
    );
    return () => {
      active = false;
    };
  }, [storage, attempt]);

  useEffect(() => {
    if (!loaded) return;
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: state.records }));
  }, [storage, loaded, state.records]);

  const add = (expense) => setState({ status: 'ready', records: [...state.records, expense] });
  const retry = () => setAttempt(attempt + 1);

  return { status: state.status, records: state.records, retry, add };
}
