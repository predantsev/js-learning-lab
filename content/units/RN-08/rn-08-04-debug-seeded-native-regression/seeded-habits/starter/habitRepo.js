// habitRepo.js (read-only): the app's own store of habits on top of a device storage adapter.
// Screens read it, change it and subscribe to its changes. It is app code, not a simulation.
import { createContext, useContext } from 'react';
import { TODAY, toggleDay } from './habits.js';
import { CURRENT_VERSION, restoreSnapshot } from './snapshot.js';

export const KEY = 'jsll.habits.v1';

export function createHabitRepo(storage) {
  let state = { status: 'loading', habits: [] };
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    async load() {
      const result = restoreSnapshot(await storage.getItem(KEY));
      state = result.ok ? { status: 'ready', habits: result.records } : { status: 'failed', habits: [] };
      notify();
    },
    getState: () => state,
    getHabits: () => state.habits,
    // Marks or unmarks today. Never saves over a snapshot that failed to load.
    async toggleToday(id) {
      if (state.status !== 'ready') return;
      state = { ...state, habits: state.habits.map((habit) => (habit.id === id ? toggleDay(habit, TODAY) : habit)) };
      notify();
      await storage.setItem(KEY, JSON.stringify({ schemaVersion: CURRENT_VERSION, records: state.habits }));
    },
    // Returns the function that removes the listener.
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // For checks: how many listeners are subscribed right now.
    listenerCount: () => listeners.size,
  };
}

export const RepoContext = createContext(null);
export const useRepo = () => useContext(RepoContext);
