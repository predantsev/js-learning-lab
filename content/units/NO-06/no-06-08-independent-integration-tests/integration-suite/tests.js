// Runs YOUR integration tests against the real system and against broken versions of it.
// Your tests are already registered: the entry run-tests.js imported integration.test.js.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { run } from './testing.js';
import { __checks, freshDataFile } from './system.js';

const { realStartServer, realCreateDataLayer, CACHE_KEY } = __checks;
const SEED_IDS = ['t-01', 't-02', 't-03'];

// A client whose listRecords() result is changed by `change(result)`.
const changedList = (change) => (adapter) => {
  const real = realCreateDataLayer(adapter);
  return { ...real, async listRecords() { return change(await real.listRecords()); } };
};

// Broken versions of the system, each with one defect your suite must notice.
const MUTANTS = {
  // The server keeps its data in memory: a restart starts again from the seed.
  'loses data on restart': { startServer: () => realStartServer({ dataFile: freshDataFile() }) },
  // The server reloads new tasks without their due date after a restart (ids and titles survive).
  'drops due dates on restart': {
    startServer: ({ dataFile, ...rest }) => {
      if (existsSync(dataFile)) {
        const tasks = JSON.parse(readFileSync(dataFile, 'utf8'));
        writeFileSync(dataFile, JSON.stringify(tasks.map((task) => (SEED_IDS.includes(task.id) ? task : { ...task, dueDate: null }))));
      }
      return realStartServer({ dataFile, ...rest });
    },
  },
  // The client asks the server, but when it already had a saved copy it keeps showing that copy as fresh.
  'saved copy beats the server': {
    createDataLayer: (adapter) => {
      const real = realCreateDataLayer(adapter);
      return {
        ...real,
        async listRecords() {
          const saved = await adapter.storage.get(CACHE_KEY);
          const result = await real.listRecords();
          if (result.stale || saved === null) return result;
          await adapter.storage.set(CACHE_KEY, saved);
          return { records: JSON.parse(saved), stale: false, failure: null };
        },
      };
    },
  },
  // Offline: the list is emptied instead of showing the saved copy.
  'offline empties the list': { createDataLayer: changedList((result) => (result.failure === 'offline' ? { ...result, records: [] } : result)) },
  // Offline: the saved copy is shown as if it were fresh server data.
  'offline copy shown as fresh': { createDataLayer: changedList((result) => (result.failure === 'offline' ? { ...result, stale: false, failure: null } : result)) },
  // A 500 answer is shown as a fresh, empty list.
  '500 shown as an empty list': { createDataLayer: changedList((result) => (result.failure === 'http' ? { records: [], stale: false, failure: null } : result)) },
  // A 500 answer keeps the copy but is classified as an unreachable server.
  '500 classified as unavailable': { createDataLayer: changedList((result) => (result.failure === 'http' ? { ...result, failure: 'unavailable' } : result)) },
};

async function runAgainst(name) {
  __checks.use(name ? MUTANTS[name] : {});
  try {
    return await run({ print: false });
  } finally {
    __checks.use({});
  }
}
let realRun = null;
const againstReal = () => (realRun ??= runAgainst(null));
const failedNames = (results) => results.filter((result) => result.status === 'failed').map((result) => `${result.name} (${result.message})`);

// A defect counts as caught when one of your tests that passes on the real system fails on the broken one.
async function expectCaught(name) {
  const real = await againstReal();
  expect(failedNames(real), 'first, your tests that fail against the real system').toEqual([]);
  const passedOnReal = new Set(real.filter((result) => result.status === 'passed').map((result) => result.name));
  const caught = (await runAgainst(name)).filter((result) => result.status === 'failed' && passedOnReal.has(result.name));
  expect(caught.length, 'your tests that pass on the real system and fail against this broken version').toBeGreaterThan(0);
}

test('your tests pass against the real system', async () => {
  const results = await againstReal();
  expect(results.filter((result) => result.status === 'passed').length, 'passing tests in your suite').toBeGreaterThan(0);
  expect(failedNames(results), 'your tests that fail against the real system').toEqual([]);
});

test('your tests catch a server that loses data on restart', () => expectCaught('loses data on restart'));
test('your tests catch a server that drops due dates on restart', () => expectCaught('drops due dates on restart'));
test('your tests catch a saved copy that beats the server after a reload', () => expectCaught('saved copy beats the server'));
test('your tests catch an offline path that empties the list', () => expectCaught('offline empties the list'));
test('your tests catch an offline copy shown as fresh', () => expectCaught('offline copy shown as fresh'));
test('your tests catch a 500 shown as an empty list', () => expectCaught('500 shown as an empty list'));
test('your tests catch a 500 classified as an unreachable server', () => expectCaught('500 classified as unavailable'));

test('the native check is recorded as not performed, with a reason', async () => {
  const results = await againstReal();
  const native = results.filter((result) => result.status === 'unperformed' && /native/i.test(result.name));
  expect(native.length, 'checks marked unperformed whose name mentions native').toBeGreaterThan(0);
  expect(native.filter((result) => result.message.trim() === '').map((result) => result.name), 'such checks without a reason').toEqual([]);
  const passedNative = results.filter((result) => result.status === 'passed' && /native/i.test(result.name));
  expect(passedNative.map((result) => result.name), 'native checks reported as passed').toEqual([]);
});
