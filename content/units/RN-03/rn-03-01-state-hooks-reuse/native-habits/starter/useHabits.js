// useHabits.js: shared data hook. Do not edit. The storage comes in as a parameter.
import { useEffect, useReducer } from 'react';
import { habitsReducer } from './habitsReducer.js';

export function useHabits(initialHabits, storage) {
  const [habits, dispatch] = useReducer(habitsReducer, initialHabits);
  useEffect(() => {
    storage.save(habits);
  }, [habits, storage]);
  return [habits, dispatch];
}
