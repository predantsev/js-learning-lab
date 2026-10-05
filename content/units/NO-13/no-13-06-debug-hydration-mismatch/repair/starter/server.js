// GET / renders the task list with its initial data.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';
import { config } from './config.js';
import { serializeForHtml, page, fallbackPage } from './html.js';

// loadTasks() gives the stored tasks; today is the server's 'YYYY-MM-DD'; log(entry) writes a log entry.
export function createApp({ loadTasks, today, log }) {
  return http.createServer((req, res) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    const tasks = loadTasks();
    const markup = renderToString(h(TaskList, { tasks, today }));
    // The client needs the locale too, so the settings travel along.
    const data = { tasks, today, config };
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-request-id': requestId });
    res.end(page(markup, serializeForHtml(data)));
  });
}
