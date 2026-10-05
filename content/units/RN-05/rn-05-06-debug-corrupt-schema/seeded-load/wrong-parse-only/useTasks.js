import { useEffect, useState } from 'react';
import { restoreSnapshot } from './restore.js';

export const KEY = 'jsll.planner.v1';
export const BACKUP_KEY = 'jsll.planner.v1.backup';

// Mistake: only wraps JSON.parse in try/catch — no migration, no validation.
// Reports { status: 'loading' | 'ready' | 'failed', tasks, notice: null | 'recovered', toggle } to the screen.
export function useTasks(storage) {
  const [state, setState] = useState({ status: 'loading', tasks: [], notice: null });

  useEffect(() => {
    let active = true;
    storage.getItem(KEY).then(
      async (text) => {
        let result;
        try {
          result = { ok: true, records: text === null ? [] : JSON.parse(text).records };
        } catch {
          result = { ok: false };
        }
        if (result.ok) {
          if (active) setState({ status: 'ready', tasks: result.records, notice: null });
          return;
        }
        // Keep the exact text before anything can overwrite it, then start empty with a notice.
        await storage.setItem(BACKUP_KEY, text);
        if (active) setState({ status: 'ready', tasks: [], notice: 'recovered' });
      },
      () => {
        if (active) setState({ status: 'failed', tasks: [], notice: null });
      },
    );
    return () => {
      active = false;
    };
  }, [storage]);

  const ready = state.status === 'ready';
  useEffect(() => {
    if (!ready) return;
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: state.tasks }));
  }, [storage, ready, state.tasks]);

  const toggle = (id) =>
    setState({ ...state, tasks: state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)) });

  return { ...state, toggle };
}
