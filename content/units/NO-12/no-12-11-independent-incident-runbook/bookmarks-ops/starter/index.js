// A demo (read-only): loads a config, starts the service on a memory store, checks the contract,
// stops it with SIGTERM. The checks test much more than this.
import { checkContract, loadConfig, startService } from './ops.js';

const records = [{ id: 'bm-1', title: '%%docs%%', url: 'https://nodejs.org/docs/latest-v22.x/api/', slug: 'node-docs', archived: false }];
const store = {
  isReady: () => true,
  list: () => records,
  async add({ title, url }) {
    const record = { id: `bm-${records.length + 1}`, title, url, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), archived: false };
    records.push(record);
    return record;
  },
  async flush() {},
};
try {
  const config = loadConfig({ DATA_DIR: '/srv/bookmarks', PORT: '7374' });
  console.log('config', config);
  const { url } = await startService({ ...config, port: 0 }, { store, exit: (code) => console.log(`exit(${code})`), log: (line) => console.log('log', line) });
  console.log('/readyz', (await fetch(`${url}/readyz`)).status);
  console.log('%%contract%%', await checkContract(url));
  process.emit('SIGTERM', 'SIGTERM');
} catch (error) {
  console.log(`${error.name}: ${error.message}`);
}
