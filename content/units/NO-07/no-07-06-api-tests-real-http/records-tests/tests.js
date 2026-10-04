// Your suite runs again (silently) against the correct API and against versions with one hidden defect.
import { readdir } from 'node:fs/promises';
import { useDefect } from './app.js';
import { run } from './testing.js';

async function suite(defect = null) {
  useDefect(defect);
  try {
    return await run({ print: false });
  } finally {
    useDefect(null);
  }
}
const failures = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

// A failing test proves something only when the same suite passes on the correct API.
async function failsOn(defect) {
  const clean = await suite();
  expect(clean.length > 0 && failures(clean).length === 0, 'precondition: your tests pass on the correct API').toBe(true);
  return failures(await suite(defect)).length > 0;
}

test('your tests pass on the correct API', async () => {
  const results = await suite();
  expect(results.length > 0, "at least one test is registered").toBe(true);
  expect(failures(results), 'tests that fail on the correct API').toEqual([]);
});

test('your tests fail when a record is answered with 201 but never written to disk', async () => {
  expect(await failsOn('noDiskWrite'), 'some test fails when nothing is stored').toBe(true);
});

test('your tests fail when the 1024-byte limit is missing', async () => {
  expect(await failsOn('noSizeLimit'), 'some test fails without the size limit').toBe(true);
});

test('your tests fail when any id is accepted', async () => {
  expect(await failsOn('noIdCheck'), 'some test fails without the id check').toBe(true);
});

test('every test closes its server and removes its data folder', async () => {
  await suite();
  await waitFor(() => !activeResources().includes('TCPServerWrap'), { timeout: 1000 }).catch(() => {});
  expect(activeResources().includes('TCPServerWrap'), 'a server is still listening after the tests').toBe(false);
  const left = (await readdir('.')).filter((name) => name.startsWith('test-data-'));
  expect(left, 'data folders left behind').toEqual([]);
});
