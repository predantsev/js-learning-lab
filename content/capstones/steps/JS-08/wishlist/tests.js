// Checks of capstone step JS-08, wishlist variant: the starting wishes arrive from data/wishes.json
// through fetch (loadFixtures in data/fixtures.js); the page shows a loading state, an error with a
// retry button and an empty list; only the latest start changes the page; and saved wishes still
// win over the starting ones. The checks run one after another on the same page and start with an
// empty storage. Most of them replace fetch with answers of their own and call start(storage) of
// ui/page.js directly, so that two starts can overlap.
const KEY = 'jsll.wishlist.v1';
const BACKUP = 'jsll.wishlist.v1.backup';
const PAGE = './ui/page.js';
const DATA = './data/fixtures.js';
const FILE = 'data/wishes.json';
const LIST = '#items';

const fixtures = () => [
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];
// Another valid list: what a different file (or the saved data of an earlier session) holds.
const sample = () => [
  { id: 'w-02', name: L.fixture2Name, price: 50, acquired: true, category: L.homeCategory },
  { id: 'w-7', name: L.newName, price: 30, acquired: false, category: null },
  { id: 'w-8', name: L.fixture5Name, price: null, acquired: false, category: null },
];
const sampleIds = ['w-02', 'w-7', 'w-8'];
// A record that the record check rejects: it has no name.
const damagedRecord = () => ({ id: 'w-09', price: 10, acquired: false, category: null });
/** Fills the form with a valid draft named `name` and submits it. */
async function addThroughForm(name) {
  await setValue(field(L.nameLabel), name);
  await setValue(field(L.valueLabel), '30');
  await user.submit(form());
}

// ---------- shared helpers ----------

// Modules are loaded inside the checks: a module that fails to load fails a check, not all of them.
async function load(path) {
  try {
    return { module: await import(path), error: null };
  } catch (error) {
    return { module: null, error };
  }
}
async function moduleWith(path, names) {
  const { module, error } = await load(path);
  expect(error ? `${error.name}: ${error.message}` : null, `an error while loading ${path.slice(2)}`).toBeNull();
  for (const name of names) expect(typeof module[name], `the named export ${name} of ${path.slice(2)}`).toBe('function');
  return module;
}

const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
/** The element and every element around it are displayed (no `hidden`, no display: none, no visibility: hidden). */
function isShown(node) {
  for (let element = node; element !== null; element = element.parentElement) {
    if (element.hidden) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}
/** The text a person sees on the page: hidden elements are left out. */
function shownText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent !== null && !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(parent.tagName) && isShown(parent)) parts.push(node.data);
  }
  return parts.join(' ');
}
const shows = (text) => inOrder(shownText(), text);
const showsAnError = () => [L.loadHttpError, L.loadNetworkError, L.loadDataError].some(shows);
/** The visible, enabled retry button, or null. */
const retryButton = () => [...document.querySelectorAll('button')].find((button) => inOrder(screen.nameOf(button), L.retryLoadLabel) && isShown(button) && !button.matches(':disabled')) ?? null;

const form = () => screen.$('form');
const saveButton = () => form()?.querySelector('button[type="submit"], button:not([type]), input[type="submit"]') ?? null;
/** The form's submit button can be pressed (a disabled fieldset around it disables it too). */
const canSave = () => saveButton() !== null && !saveButton().matches(':disabled');
/** The form field whose label contains `label`. */
const field = (label) => [...(form()?.querySelectorAll('input, select, textarea') ?? [])].find((node) => inOrder(screen.nameOf(node), label)) ?? null;
/** Put a value into a field the way the page receives it (also for number fields). */
async function setValue(node, value) {
  node.focus();
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
const cards = () => [...(screen.$(LIST)?.querySelectorAll('[data-id]') ?? [])];
const cardIds = () => cards().map((node) => node.dataset.id);
const savedValue = () => {
  try {
    return JSON.parse(storage.getItem(KEY));
  } catch (error) {
    return null;
  }
};
const saved = (records) => JSON.stringify({ schemaVersion: 1, records });

/** Waits until `condition()` is true; returns false instead of failing when it stays false. */
async function until(condition, timeout = 1500) {
  try {
    await waitFor(() => condition() === true, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}
/** The page has finished a load: cards, an error message or the empty message are visible. */
const loadOver = () => until(() => !shows(L.loadingMessage) && (cards().length > 0 || showsAnError() || shows(L.emptyMessage)), 2500);

/** A 200 answer with the file format `{ schemaVersion: 1, records }`, after `delay` ms. */
const fileAnswer = (records, delay = 0) => ({ status: 200, body: { schemaVersion: 1, records }, delay });
/**
 * Replaces fetch: the n-th request gets answers[n] (the last answer repeats), and `requests` lists
 * the requested paths. `finish()` waits until every answer is out, then puts the real fetch back.
 */
function serve(...answers) {
  const requests = [];
  let doneBy = 0;
  const mock = mockFetch((url) => {
    const answer = answers[Math.min(requests.length, answers.length - 1)];
    requests.push(url.pathname);
    doneBy = Math.max(doneBy, performance.now() + (answer.delay ?? 0));
    return answer;
  });
  return {
    requests,
    async finish() {
      const rest = doneBy - performance.now() + 40;
      if (rest > 0) await sleep(rest);
      await settle();
      mock.restore();
    },
  };
}
/** Calls start(storage) of ui/page.js with only `text` saved (nothing when text is null). */
async function startPage(text) {
  const page = await moduleWith(PAGE, ['start']);
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  let thrown = null;
  try {
    Promise.resolve(page.start(storage)).catch(() => {});
  } catch (error) {
    thrown = error;
  }
  expect(thrown === null ? null : `${thrown.name}: ${thrown.message}`, 'an error thrown by start(storage)').toBeNull();
  await sleep(0);
}
/** `{ value }` when the promise is fulfilled, `{ error }` when it rejects (or the call throws). */
async function outcome(call) {
  try {
    return { value: await call() };
  } catch (error) {
    return { error: `${error?.name}: ${error?.message}` };
  }
}

// ---------- checks ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('with nothing saved the six starting wishes arrive', async () => {
  await loadOver();
  expect(cardIds(), 'the data-id of the cards on a first start with nothing saved').toEqual(fixtures().map((record) => record.id));
  expect(shows(L.loadingMessage), `"${L.loadingMessage}" on the page once the wishes are there`).toBe(false);
  expect(showsAnError() || shows(L.loadErrorMessage), 'an error message on a first start').toBe(false);
});

test('loadFixtures returns the checked wishes of the file', async () => {
  const { loadFixtures } = await moduleWith(DATA, ['loadFixtures']);
  expect(await outcome(() => loadFixtures(new AbortController().signal)), `loadFixtures(signal) with the project file ${FILE}`).toEqual({ value: fixtures() });
  for (const [answer, what] of [[{ status: 404, body: 'Not found' }, 'status 404'], [fileAnswer([...sample(), damagedRecord()]), 'a wish without a name']]) {
    const server = serve(answer);
    try {
      const result = await outcome(() => loadFixtures(new AbortController().signal));
      expect('error' in result ? 'rejects' : `returns ${JSON.stringify(result.value)?.slice(0, 80)}`, `loadFixtures when ${FILE} answers with ${what}`).toBe('rejects');
    } finally {
      await server.finish();
    }
  }
});

test('while the starting wishes load the page says so', async () => {
  const server = serve(fileAnswer(fixtures(), 400));
  try {
    await startPage(null);
    await sleep(60);
    expect(shows(L.loadingMessage), `"${L.loadingMessage}" while the answer is on its way`).toBe(true);
    expect(cardIds(), 'the cards while the answer is on its way').toEqual([]);
    expect(retryButton(), `a visible "${L.retryLoadLabel}" button while the answer is on its way`).toBeNull();
    expect(await until(() => cards().length === 6), 'six cards after the answer').toBe(true);
    expect(shows(L.loadingMessage), `"${L.loadingMessage}" after the answer`).toBe(false);
  } finally {
    await server.finish();
  }
});

test('the starting wishes are the ones the file answers', async () => {
  const server = serve(fileAnswer(sample()));
  try {
    await startPage(null);
    await loadOver();
    expect(server.requests.some((path) => path.endsWith('/' + FILE)), `a request for ${FILE} (requested: ${JSON.stringify(server.requests)})`).toBe(true);
    expect(cardIds(), `the data-id of the cards when ${FILE} answers w-02, w-7 and w-8`).toEqual(sampleIds);
  } finally {
    await server.finish();
  }
});

test('an answer that is not ok shows its status and a retry button', async () => {
  for (const status of [404, 500]) {
    const server = serve({ status, body: 'Not available' });
    try {
      await startPage(null);
      await loadOver();
      expect(inOrder(shownText(), L.loadHttpError, String(status)), `"${L.loadHttpError} ${status}" on the page when ${FILE} answers ${status}`).toBe(true);
      expect(cardIds(), `the cards after the answer ${status}`).toEqual([]);
      expect(retryButton() !== null, `a visible, enabled "${L.retryLoadLabel}" button after the answer ${status}`).toBe(true);
    } finally {
      await server.finish();
    }
  }
});

test('no connection shows the connection message and a retry button', async () => {
  const server = serve({ networkError: true });
  try {
    await startPage(null);
    await loadOver();
    expect(shows(L.loadNetworkError), `"${L.loadNetworkError}" on the page when fetch rejects without an answer`).toBe(true);
    expect(cardIds(), 'the cards without a connection').toEqual([]);
    expect(retryButton() !== null, `a visible, enabled "${L.retryLoadLabel}" button without a connection`).toBe(true);
  } finally {
    await server.finish();
  }
});

test('a damaged file shows the damaged-data message', async () => {
  const cases = [
    [{ status: 200, body: '<!doctype html><p>Not here</p>', headers: { 'content-type': 'text/html' } }, 'an HTML page'],
    [{ status: 200, body: '{"schemaVersion": 1, "records": [', headers: { 'content-type': 'application/json' } }, 'broken JSON'],
    [{ status: 200, body: { schemaVersion: 2, records: fixtures() } }, 'schemaVersion 2'],
    [{ status: 200, body: null }, 'null'],
    [fileAnswer([...sample(), damagedRecord()]), 'a wish without a name'],
  ];
  for (const [answer, what] of cases) {
    const server = serve(answer);
    try {
      await startPage(null);
      await loadOver();
      expect(shows(L.loadDataError), `"${L.loadDataError}" on the page when ${FILE} answers with ${what}`).toBe(true);
      expect(cardIds(), `the cards when ${FILE} answers with ${what}`).toEqual([]);
    } finally {
      await server.finish();
    }
  }
});

test('the retry button loads the wishes again', async () => {
  const server = serve({ status: 404, body: 'Not found' }, fileAnswer(fixtures(), 300));
  try {
    await startPage(null);
    expect(await until(() => retryButton() !== null), `a visible, enabled "${L.retryLoadLabel}" button after the answer 404`).toBe(true);
    await user.click(retryButton());
    await sleep(60);
    expect(shows(L.loadingMessage), `"${L.loadingMessage}" after a click on "${L.retryLoadLabel}"`).toBe(true);
    expect(retryButton(), `a visible, enabled "${L.retryLoadLabel}" button while the new answer is on its way`).toBeNull();
    expect(await until(() => cards().length === 6), 'six cards after the second answer').toBe(true);
    expect(showsAnError(), 'an error message after the second answer brought the wishes').toBe(false);
    expect(server.requests.length, 'the number of requests: the first one and one after the click').toBe(2);
  } finally {
    await server.finish();
  }
});

test('an empty starting list says so, but only once it has arrived', async () => {
  const server = serve(fileAnswer([], 300));
  try {
    await startPage(null);
    await sleep(60);
    expect(shows(L.emptyMessage), `"${L.emptyMessage}" while the answer is on its way`).toBe(false);
    await loadOver();
    expect(shows(L.emptyMessage), `"${L.emptyMessage}" after ${FILE} answered an empty list`).toBe(true);
    expect(cardIds(), 'the cards after an empty list').toEqual([]);
    expect(showsAnError(), 'an error message after an empty list').toBe(false);
  } finally {
    await server.finish();
  }
});

test('the form saves only when the list is ready', async () => {
  let server = serve(fileAnswer(fixtures(), 300));
  try {
    await startPage(null);
    await sleep(60);
    expect(canSave(), 'the Save button can be pressed while the starting wishes load').toBe(false);
    await loadOver();
    expect(canSave(), 'the Save button can be pressed after the starting wishes arrived').toBe(true);
  } finally {
    await server.finish();
  }
  server = serve({ status: 404, body: 'Not found' });
  try {
    await startPage(null);
    await loadOver();
    expect(canSave(), 'the Save button can be pressed after the answer 404').toBe(false);
  } finally {
    await server.finish();
  }
  await startPage(saved(sample()));
  await sleep(60);
  expect(canSave(), 'the Save button can be pressed after a start with saved wishes').toBe(true);
});

test('only the latest start changes the page', async () => {
  const server = serve(fileAnswer(fixtures(), 700), fileAnswer(sample(), 250));
  try {
    await startPage(null);
    await sleep(50);
    await startPage(null); // a new start while the first answer is still on its way
    await sleep(60);
    expect(showsAnError() || retryButton() !== null, 'an error message or a retry button after the first load was replaced by a newer one').toBe(false);
    expect(await until(() => cards().length > 0), 'cards after the newer answer').toBe(true);
    expect(cardIds(), 'the data-id of the cards after the newer answer (w-02, w-7, w-8)').toEqual(sampleIds);
    await sleep(700); // by now the older answer would have arrived
    expect(cardIds(), 'the data-id of the cards after the older answer would have arrived').toEqual(sampleIds);
    expect(showsAnError(), 'an error message at the end').toBe(false);
  } finally {
    await server.finish();
  }
});

test('saved wishes win and need no request', async () => {
  const server = serve(fileAnswer(fixtures()));
  try {
    await startPage(saved(sample()));
    await sleep(150);
    expect(cardIds(), 'the data-id of the cards with w-02, w-7 and w-8 saved').toEqual(sampleIds);
    expect(server.requests.length, 'the number of requests for the starting wishes when valid wishes are saved').toBe(0);
    expect(shows(L.loadingMessage) || showsAnError(), 'a loading or error message with valid wishes saved').toBe(false);
  } finally {
    await server.finish();
  }
});

test('damaged saved data shows its message and loads the starting wishes', async () => {
  const server = serve(fileAnswer(fixtures(), 100));
  try {
    await startPage('{bad');
    await loadOver();
    expect(shows(L.loadErrorMessage), `"${L.loadErrorMessage}" with the text {bad saved`).toBe(true);
    expect(cardIds(), 'the data-id of the cards with {bad saved').toEqual(fixtures().map((record) => record.id));
    expect(server.requests.length, 'the number of requests for the starting wishes with {bad saved').toBe(1);
    expect(storage.getItem(BACKUP), `the text under "${BACKUP}"`).toBe('{bad');
  } finally {
    await server.finish();
  }
});

test('a wish added after loading is saved with a new id', async () => {
  const server = serve(fileAnswer(fixtures()));
  try {
    await startPage(null);
    await loadOver();
    await addThroughForm(L.newName);
    const value = savedValue();
    expect(value?.schemaVersion, `schemaVersion in the JSON under "${KEY}" after adding a wish`).toBe(1);
    const ids = Array.isArray(value?.records) ? value.records.map((record) => record.id) : [];
    expect(ids.length, 'the number of saved records after adding a wish to the six starting ones').toBe(7);
    expect(new Set(ids).size, `different ids among the saved ids ${JSON.stringify(ids)}`).toBe(7);
    expect(value.records.some((record) => record.name === L.newName), `a saved record named "${L.newName}"`).toBe(true);
  } finally {
    await server.finish();
  }
});
