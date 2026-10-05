// The planner service's summary: pending tasks, and pending tasks due on or before a given day.
import { isOnOrBefore, version } from './vendor/day-utils.js';
import { readTasks } from './store.js';

export const dayUtilsVersion = version;

export async function summary(dir, day) {
  const pending = (await readTasks(dir)).filter((task) => !task.done);
  return {
    pending: pending.length,
    dueBy: pending.filter((task) => task.dueDate !== null && isOnOrBefore(task.dueDate, day)).length,
  };
}
