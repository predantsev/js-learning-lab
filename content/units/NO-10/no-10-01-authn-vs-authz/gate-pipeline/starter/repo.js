// An in-memory task repository (read-only). It writes down every call in `calls`,
// so you (and the checks) can see whether a request reached the data at all.
import { seedTasks } from './lab-data.js';

export function createRepo() {
  const tasks = seedTasks.map((task) => ({ ...task }));
  const calls = [];
  return {
    calls,
    findTask(id) {
      calls.push(`findTask ${id}`);
      return tasks.find((task) => task.id === id);
    },
    deleteTask(id) {
      calls.push(`deleteTask ${id}`);
      tasks.splice(tasks.findIndex((task) => task.id === id), 1);
    },
  };
}
