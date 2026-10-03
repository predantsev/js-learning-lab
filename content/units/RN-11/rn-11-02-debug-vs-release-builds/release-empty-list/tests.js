import { loadExpenses } from './loadExpenses.js';
import { calls } from './simulated-network.js';

const DEV_HOSTS = ['10.0.2.2', 'localhost', '127.0.0.1'];
const toDevMachine = () => calls.filter((url) => DEV_HOSTS.some((host) => url.includes(host)));

async function inBuild(mode, fn) {
  const saved = globalThis.__DEV__;
  globalThis.__DEV__ = mode === 'debug';
  try {
    return await fn();
  } finally {
    globalThis.__DEV__ = saved;
  }
}

test('the release screen shows the six bundled expenses', async () => {
  await waitFor(() => screen.text().includes(L.lunch));
  expect(screen.text(), 'the release screen').toContain(L.groceries);
  expect(screen.text(), 'the release screen').toContain(`${L.count}: 6`);
});

test('a release build sends no request to the developer computer', async () => {
  const before = toDevMachine().length;
  const expenses = await inBuild('release', () => loadExpenses());
  expect(toDevMachine().slice(before), 'requests to the developer computer in release').toEqual([]);
  expect(expenses.map((expense) => expense.id), 'ids loaded in release').toEqual(['e-01', 'e-02', 'e-03', 'e-04', 'e-05', 'e-06']);
});

test('a debug build still loads from the mock service', async () => {
  const before = calls.length;
  const expenses = await inBuild('debug', () => loadExpenses());
  expect(calls.slice(before), 'requests in debug').toEqual(['http://10.0.2.2:7310/records/expenses']);
  expect(expenses.map((expense) => expense.id), 'ids loaded in debug').toEqual(['e-01', 'e-02']);
});
