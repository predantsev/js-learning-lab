// Runs the client against the server and then your two tests.
import { createServer, ALLOWED_ORIGINS } from './server.js';
import { createDataSource } from './data-source.js';
import { contractTest, preflightTest } from './checks.js';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const source = createDataSource({ baseUrl: base });
try {
  const list = await source.listRecords();
  console.log(`%%list%%: ${list.map((wish) => wish.id).join(', ')}`);
  try {
    const updated = await source.updateRecord('w-01', { acquired: true });
    console.log(`PATCH w-01: ${updated.acquired ? '%%acquired%%' : '%%wanted%%'}, %%price%% ${updated.price}`);
  } catch (error) {
    console.log(`PATCH w-01: ${error.name}: ${error.message}`);
  }
  console.log(`contractTest: ${JSON.stringify(await contractTest(base))}`);
  console.log(`preflightTest: ${JSON.stringify(await preflightTest(base, ALLOWED_ORIGINS[0]))}`);
} finally {
  server.closeAllConnections();
  server.close();
}
