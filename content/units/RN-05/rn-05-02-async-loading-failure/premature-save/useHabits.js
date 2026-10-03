import { useEffect, useState } from 'react';

const KEY = 'jsll.habits.v1';

export function useHabits(storage) {
  const [habits, setHabits] = useState([]);

  // Load once at launch.
  useEffect(() => {
    storage.getItem(KEY).then((text) => {
      setHabits(text === null ? [] : JSON.parse(text).records);
    });
  }, [storage]);

  // Save after every change of the list.
  useEffect(() => {
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: habits }));
  }, [storage, habits]);

  return habits;
}
