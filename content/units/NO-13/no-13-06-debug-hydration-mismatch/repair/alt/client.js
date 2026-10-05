// The client entry's render: in the browser, hydrateRoot(root, clientElement(data)).
import { createElement as h } from './mini-react.js';
import { TaskList } from './TaskList.js';

export function clientElement({ tasks, today }) {
  return h(TaskList, { tasks, today });
}
