// Starts the notes API and runs the contract test against it.
import { createApp } from './app.js';
import { checkContract } from './contract-check.ts';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const problems = await checkContract(`http://127.0.0.1:${server.address().port}`);
  console.log(problems.length === 0 ? '%%kept%%' : `%%broken%%\n${problems.join('\n')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
