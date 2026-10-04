// The expense client's data layer: it shows totals per category from whichever source the config names.
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createDataSource } from './data-source.js';
import { totalsByCategory } from './summary.js';

process.env.DATA_SOURCE ??= 'fixtures'; // in a real project the terminal or a .env file sets this

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  // The server's address is not written in any data module: it arrives through the configuration.
  process.env.API_BASE_URL = `http://127.0.0.1:${server.address().port}`;

  const config = loadConfig(process.env);
  const source = createDataSource(config);
  const expenses = await source.listRecords();
  console.log(`%%source%%: ${config.dataSource}, %%count%%: ${expenses.length}`);
  for (const [category, totalMinor] of totalsByCategory(expenses)) {
    console.log(`  ${category}: ${(totalMinor / 100).toFixed(2)}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
