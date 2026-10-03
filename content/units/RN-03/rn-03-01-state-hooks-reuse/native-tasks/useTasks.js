// useTasks.js: shared data hook. It never touches localStorage: the caller passes the storage in.
import { useEffect, useReducer } from 'react';
import { tasksReducer } from './tasksReducer.js';

export function useTasks(initialTasks, storage) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  useEffect(() => {
    storage.save(tasks);
  }, [tasks, storage]);
  return [tasks, dispatch];
}
