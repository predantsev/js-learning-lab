// The client entry's render: in the browser, hydrateRoot(root, clientElement(data)).
import { createElement as h } from './mini-react.js';
import { TaskList } from './TaskList.js';

export function clientElement(data) {
  // The same "today" the server rendered with.
  return h(TaskList, { tasks: data.tasks, today: data.today });
}
