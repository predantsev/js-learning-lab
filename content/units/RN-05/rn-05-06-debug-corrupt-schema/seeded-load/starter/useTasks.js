import { useEffect, useState } from 'react';
import { restoreSnapshot } from './restore.js';

export const KEY = 'jsll.planner.v1';
export const BACKUP_KEY = 'jsll.planner.v1.backup';

// Reports { status: 'loading' | 'ready' | 'failed', tasks, notice: null | 'recovered', toggle } to the screen.
export function useTasks(storage) {
  const [state, setState] = useState({ status: 'loading', tasks: [], notice: null });

  useEffect(() => {
    storage.getItem(KEY).then((text) => {
      const snapshot = text === null ? { schemaVersion: 1, records: [] } : JSON.parse(text);
      setState({ status: 'ready', tasks: snapshot.records, notice: null });
    });
  }, [storage]);

  useEffect(() => {
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: state.tasks }));
  }, [storage, state.tasks]);

  const toggle = (id) =>
    setState({ ...state, tasks: state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)) });

  return { ...state, toggle };
}
