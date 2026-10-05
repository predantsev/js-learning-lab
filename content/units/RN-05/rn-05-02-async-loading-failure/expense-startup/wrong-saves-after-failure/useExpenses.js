import { useEffect, useState } from 'react';

const KEY = 'jsll.expenses.v1';

// Mistake: the guard only waits for "not loading", so a failed read also unlocks saving.
export function useExpenses(storage) {
  const [state, setState] = useState({ status: 'loading', records: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    storage.getItem(KEY).then(
      (text) => {
        if (!active) return;
        const records = text === null ? [] : JSON.parse(text).records;
        setState({ status: records.length === 0 ? 'empty' : 'ready', records });
      },
      () => {
        if (active) setState({ status: 'failed', records: [] });
      },
    );
    return () => {
      active = false;
    };
  }, [storage, attempt]);

  const settled = state.status !== 'loading';
  useEffect(() => {
    if (!settled) return;
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: state.records }));
  }, [storage, settled, state.records]);

  const add = (expense) => setState({ status: 'ready', records: [...state.records, expense] });
  const retry = () => {
    setState({ status: 'loading', records: [] });
    setAttempt(attempt + 1);
  };

  return { status: state.status, records: state.records, retry, add };
}
