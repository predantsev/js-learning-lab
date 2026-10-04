// The client entry's render: in the browser, hydrateRoot(root, clientElement(data)).
import { createElement as h } from './mini-react.js';
import { TaskList } from './TaskList.js';

export function clientElement(data) {
  // The browser knows best what day it is.
  const today = new Date().toISOString().slice(0, 10);
  return h(TaskList, { tasks: data.tasks, today });
}
