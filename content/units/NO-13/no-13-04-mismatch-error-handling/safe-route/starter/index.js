// Driver (read-only): one good request, one whose data breaks the render, and one more good request.
import http from 'node:http';
import { createRenderRoute, reportRecoverable } from './route.js';

const good = [{ id: 't-01', title: '%%water%%', dueDate: '2026-03-02' }];
const damaged = [{ id: 't-09', title: '%%imported%%', dueDate: 20260302 }];
let calls = 0;
const loadTasks = () => (calls++ === 1 ? damaged : good);
const log = (entry) => console.log(`log: ${JSON.stringify(entry)}`);

const server = http.createServer(createRenderRoute({ loadTasks, log }));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const id of ['req-1', 'req-2', 'req-3']) {
    const response = await fetch(`${base}/`, { headers: { 'x-request-id': id }, signal: AbortSignal.timeout(2000) });
    console.log(`${id}: ${response.status} ${(await response.text()).length} chars`);
  }
} catch (error) {
  console.log(`%%clientError%%: ${error.message}`);
} finally {
  server.closeAllConnections();
  server.close();
}

// What the client entry would do when React reports a hydration mismatch.
reportRecoverable(log, 'req-3')(new Error("%%mismatchMessage%%"), { componentStack: '\n    at li\n    at TaskList' });
