// Starts the habits API and runs the contract test against it.
import { createServer } from './server.js';
import { checkRecordsContract } from './contract-test.ts';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const problems = await checkRecordsContract(`http://127.0.0.1:${server.address().port}`);
  console.log(problems.length === 0 ? '%%kept%%' : `%%broken%%\n${problems.join('\n')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
