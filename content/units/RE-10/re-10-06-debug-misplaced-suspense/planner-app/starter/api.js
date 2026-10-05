import { tasks } from "./tasks";

// A pretend request: the number of open tasks arrives after 300 ms.
export function loadOpenCount() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(tasks.filter((task) => !task.done).length), 300);
  });
}
