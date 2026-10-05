// GET / renders the task list with its initial data.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';
import { config } from './config.js';
import { serializeForHtml, page, fallbackPage } from './html.js';

const publicTask = ({ id, title, dueDate, done }) => ({ id, title, dueDate, done });

// loadTasks() gives the stored tasks; today is the server's 'YYYY-MM-DD'; log(entry) writes a log entry.
export function createApp({ loadTasks, today, log }) {
  return http.createServer((req, res) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    const tasks = loadTasks();
    const markup = renderToString(h(TaskList, { tasks, today }));
    // Only what the browser may see: public task fields, today and the locale.
    const data = { tasks: tasks.map(publicTask), today, locale: config.locale };
    const html = page(markup, serializeForHtml(data));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-request-id': requestId });
    res.end(html);
  });
}
