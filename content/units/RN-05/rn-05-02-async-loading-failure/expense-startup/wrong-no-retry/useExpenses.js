import { useEffect, useState } from 'react';

const KEY = 'jsll.expenses.v1';

// Mistake: the failed state is shown, but retry only changes the status and never reads again.
export function useExpenses(storage) {
  const [state, setState] = useState({ status: 'loading', records: [] });

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
  }, [storage]);

  const loaded = state.status === 'ready' || state.status === 'empty';
  useEffect(() => {
    if (!loaded) return;
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: state.records }));
  }, [storage, loaded, state.records]);

  const add = (expense) => setState({ status: 'ready', records: [...state.records, expense] });
  const retry = () => setState({ status: 'loading', records: [] });

  return { status: state.status, records: state.records, retry, add };
}
