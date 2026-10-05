import { useEffect, useState } from 'react';
import { restoreSnapshot } from './restore.js';

export const KEY = 'jsll.planner.v1';
export const BACKUP_KEY = 'jsll.planner.v1.backup';

// Another approach: an async load function, and saving only from the toggle handler.
export function useTasks(storage) {
  const [state, setState] = useState({ status: 'loading', tasks: [], notice: null });

  useEffect(() => {
    let active = true;
    async function load() {
      let text;
      try {
        text = await storage.getItem(KEY);
      } catch {
        if (active) setState({ status: 'failed', tasks: [], notice: null });
        return;
      }
      const result = restoreSnapshot(text);
      if (!result.ok) await storage.setItem(BACKUP_KEY, text);
      if (!active) return;
      setState(result.ok
        ? { status: 'ready', tasks: result.records, notice: null }
        : { status: 'ready', tasks: [], notice: 'recovered' });
    }
    load();
    return () => {
      active = false;
    };
  }, [storage]);

  const toggle = (id) => {
    const tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
    setState({ ...state, tasks });
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: tasks }));
  };

  return { ...state, toggle };
}
