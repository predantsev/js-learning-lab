// GET / renders the task list with its initial data.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';
import { config } from './config.js';
import { serializeForHtml, page, fallbackPage } from './html.js';

function renderFull(tasks, today) {
  const markup = renderToString(h(TaskList, { tasks, today }));
  const visible = tasks.map((task) => ({ id: task.id, title: task.title, dueDate: task.dueDate, done: task.done }));
  return page(markup, serializeForHtml({ tasks: visible, today, locale: config.locale }));
}

// loadTasks() gives the stored tasks; today is the server's 'YYYY-MM-DD'; log(entry) writes a log entry.
export function createApp({ loadTasks, today, log }) {
  return http.createServer((req, res) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('x-request-id', requestId);
    try {
      res.end(renderFull(loadTasks(), today));
    } catch (error) {
      log({ level: 'error', requestId, message: error.message });
      res.statusCode = 500;
      res.end(fallbackPage(requestId));
    }
  });
}
