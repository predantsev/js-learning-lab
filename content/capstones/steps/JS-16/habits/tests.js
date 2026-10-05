// Checks of capstone step JS-16, habits variant: ui/address.js reads and writes the view of the list
// (?q=…&show=…) through URLSearchParams and URL, trusting only known filters; the page writes the
// search and the filter into its address with history.replaceState and reads them back on start;
// loadFixtures tries once more after a network failure (and only then); names from the file and
// from the address stay text; the page stores nothing but its own records; and the learner's
// address tests catch an address written without encoding and a readView that trusts any filter.
//
// The checks start with an empty storage; page checks call start(storage) of ui/page.js again (a
// restart). Checks that change the address of the page put the original address back. fetch is
// replaced with answers of the checks (mockFetch); timers are replaced by a fake clock.
const KEY = 'jsll.habits.v1';
const BACKUP = 'jsll.habits.v1.backup';
const ADDRESS = 'ui/address.js';
const DATA = './data/fixtures.js';
const SWAP = ADDRESS;
const SUITE = 'tests/address.test.js';
const RUNNER = 'tests/testing.js';
const DRIVER = 'run-tests.js';
const PAGE = './ui/page.js';
const LIST = '#habits';
const FILTERS = ["active", "paused"];
const NAME = 'name';
const HARNESS = ['test', 'expect', 'user', 'screen', 'scope', 'scopeOf', 'logs', 'rawLogs', 'alerts', 'loadError', 'spy', 'mockFetch', 'storage', 'files', 'rerun', 'sleep', 'settle', 'waitFor', 'L'];

const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const CORRECT = fill("// The view of the list in the page address: ?q=<search>&show=<filter>. The address is untrusted\n// input — anyone can send a link with any text in it — so it is read through URLSearchParams and the\n// filter is accepted only from a known list. Writing goes through URL and searchParams, which encode\n// every value (a space, \"&\", \"#\", Cyrillic letters), so the same text comes back after a reload.\n\n// The search and the filter of an address query such as \"?q=%D0%94%D1%96%D0%BC&show=all\".\n// A missing search is \"\", and a filter that is not one of `filters` is \"all\".\nexport function readView(search, filters) {\n  const params = new URLSearchParams(search);\n  const show = params.get(\"show\");\n  return {\n    query: params.get(\"q\") ?? \"\",\n    filter: show !== null && filters.includes(show) ? show : \"all\",\n  };\n}\n\n// The address `href` with the view written into its query: q for a search that is not empty, show\n// for a filter other than \"all\". Other parameters and the path of the address stay as they are.\nexport function viewAddress(href, view) {\n  const url = new URL(href);\n  if (view.query === \"\") {\n    url.searchParams.delete(\"q\");\n  } else {\n    url.searchParams.set(\"q\", view.query);\n  }\n  if (view.filter === \"all\") {\n    url.searchParams.delete(\"show\");\n  } else {\n    url.searchParams.set(\"show\", view.filter);\n  }\n  return url.href;\n}\n");
const TESTING = fill("// A small test runner written for this course. Read it if you like; you do not change it.\n// Real test runners (Vitest, Jest) work the same way: test(name, fn) registers a test,\n// expect(actual).toBe(expected) compares, and a failed comparison throws an error.\nconst WORDS = {\n  expected: \"%%rExpected%%\",\n  got: \"%%rGot%%\",\n  sameFields: \"%%rSameFields%%\",\n  needsFunction: \"%%rNeedsFunction%%\",\n  didNotThrow: \"%%rDidNotThrow%%\",\n  otherError: \"%%rOtherError%%\",\n  summary: \"%%rSummary%%\",\n  noTests: \"%%rNoTests%%\",\n};\n\nconst registered = [];\n\nexport function test(name, fn) {\n  registered.push({ name, fn });\n}\n\nclass AssertionError extends Error {\n  name = \"AssertionError\";\n}\n\nfunction isObject(value) {\n  return value !== null && typeof value === \"object\" && !Array.isArray(value);\n}\n\n// Same content: arrays item by item, in order; objects key by key, in any key order.\nfunction equal(a, b) {\n  if (Object.is(a, b)) return true;\n  if (Array.isArray(a) && Array.isArray(b)) {\n    return a.length === b.length && a.every((item, index) => equal(item, b[index]));\n  }\n  if (isObject(a) && isObject(b)) {\n    const keys = Object.keys(a);\n    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));\n  }\n  return false;\n}\n\nfunction show(value) {\n  if (typeof value === \"string\") return JSON.stringify(value);\n  if (typeof value === \"function\") return `[function ${value.name || \"anonymous\"}]`;\n  if (Array.isArray(value)) return `[${value.map(show).join(\", \")}]`;\n  if (isObject(value)) {\n    const entries = Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`);\n    return entries.length === 0 ? \"{}\" : `{ ${entries.join(\", \")} }`;\n  }\n  return String(value);\n}\n\nexport function expect(actual, message = \"\") {\n  const fail = (text) => {\n    throw new AssertionError(message ? `${message}: ${text}` : text);\n  };\n  return {\n    // Identity: the same primitive value, or the very same object.\n    toBe(expected) {\n      if (Object.is(actual, expected)) return;\n      const hint = typeof actual === \"object\" && actual !== null && equal(actual, expected) ? ` ${WORDS.sameFields}` : \"\";\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}${hint}`);\n    },\n    // Same content, even if these are two different objects or arrays.\n    toEqual(expected) {\n      if (equal(actual, expected)) return;\n      fail(`${WORDS.expected} ${show(expected)}, ${WORDS.got} ${show(actual)}`);\n    },\n    // `actual` must be a function; it is called here and must throw.\n    toThrow(ErrorType) {\n      if (typeof actual !== \"function\") fail(WORDS.needsFunction);\n      try {\n        actual();\n      } catch (error) {\n        if (ErrorType === undefined || error instanceof ErrorType) return;\n        fail(`${WORDS.otherError} ${ErrorType.name}, ${WORDS.got} ${error.name}: ${error.message}`);\n      }\n      fail(WORDS.didNotThrow);\n    },\n  };\n}\n\n// Runs every registered test, one after another, and prints one line per test.\nexport async function run({ print = true, reverse = false } = {}) {\n  const queue = reverse ? [...registered].reverse() : registered;\n  const results = [];\n  for (const { name, fn } of queue) {\n    try {\n      await fn();\n      results.push({ name, passed: true });\n    } catch (error) {\n      const text = error instanceof AssertionError ? error.message : error instanceof Error ? `${error.name}: ${error.message}` : String(error);\n      results.push({ name, passed: false, message: text });\n    }\n  }\n  if (print) {\n    if (results.length === 0) console.log(WORDS.noTests);\n    for (const result of results) {\n      if (result.passed) console.log(`✓ ${result.name}`);\n      else console.error(`✗ ${result.name} — ${result.message}`);\n    }\n    const failed = results.filter((result) => !result.passed).length;\n    console.log(WORDS.summary.replace(\"{passed}\", results.length - failed).replace(\"{failed}\", failed));\n  }\n  return results;\n}\n");
function broken(from, to) {
  if (!CORRECT.includes(from)) throw new Error(`the reference ${ADDRESS} does not contain: ${from}`);
  return CORRECT.replace(from, to);
}
const BROKEN = {
  noEncoding: broken('    url.searchParams.set("q", view.query);', '    url.search = url.search + (url.search === "" ? "?" : "&") + "q=" + view.query;'),
  anyFilter: broken('    filter: show !== null && filters.includes(show) ? show : "all",', '    filter: show ?? "all",'),
};
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
const saved = (records) => JSON.stringify({ schemaVersion: 1, records });
// ---------- shared helpers ----------

// Modules are loaded inside the checks: a module that fails to load fails a check, not all of them.
async function moduleWith(path, names) {
  let module = null;
  let problem = null;
  try {
    module = await import(path);
  } catch (error) {
    problem = `${error?.name}: ${error?.message}`;
  }
  expect(problem, `an error while loading ${path.slice(2)}`).toBeNull();
  for (const name of names) expect(typeof module[name], `the named export ${name} of ${path.slice(2)}`).toBe('function');
  return module;
}
/** A stand-in for localStorage that keeps the text in a plain object. */
function memoryStorage() {
  const data = {};
  return {
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    saved() {
      try {
        return JSON.parse(data[KEY]);
      } catch (error) {
        return null;
      }
    },
  };
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
const form = () => screen.$('form');
/** The form field whose label contains `label`. */
const field = (label) => [...(form()?.querySelectorAll('input, select, textarea') ?? [])].find((node) => inOrder(screen.nameOf(node), label)) ?? null;
async function setValue(node, value) {
  node.value = value;
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}
const cardIds = () => cards().map((node) => node.dataset.id);
const cards = () => [...(screen.$(LIST)?.querySelectorAll('[data-id]') ?? [])];
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
/** The text of a card without its buttons (a button may repeat the word of a mark). */
function cardText(id) {
  const copy = card(id)?.cloneNode(true);
  if (!copy) return '';
  for (const button of copy.querySelectorAll('button')) button.remove();
  return copy.textContent;
}
/** The button of a card whose accessible name contains `label`. */
const cardButton = (id, label) => [...(card(id)?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label)) ?? null;
/** The saved records, or null. */
function savedRecords() {
  try {
    return JSON.parse(storage.getItem(KEY)).records;
  } catch (error) {
    return null;
  }
}
const savedRecord = (id) => savedRecords()?.find((record) => record.id === id) ?? null;
async function until(condition, timeout = 1500) {
  try {
    await waitFor(() => condition() === true, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}
/** Restarts the page with only `text` saved (nothing when text is null) and waits for six cards. */
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
  // Waits until the load is over (some cards are there), then expects exactly the first page.
  await until(() => cards().length > 0, 2500);
  await settle();
  expect(cards().length, 'the number of cards after a start (the first page of the six starting habits)').toBe(4);
  return page;
}

// ---------- running the learner's suite with swapped modules ----------

const blobUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
function resolvePath(from, spec) {
  const parts = from.split('/').slice(0, -1);
  for (const segment of spec.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}
const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*)\2/g;
/** Blob URLs for `path` and every project module it imports; `given` replaces project files. */
function moduleUrls(path, given, urls = {}) {
  if (urls[path] !== undefined) return urls;
  const code = given[path] ?? files[path];
  if (typeof code !== 'string') throw new Error(`there is no file ${path}`);
  urls[path] = null;
  for (const match of code.matchAll(IMPORT)) {
    const target = resolvePath(path, match[3]);
    if (/\.m?js$/.test(target) && (given[target] !== undefined || typeof files[target] === 'string')) moduleUrls(target, given, urls);
  }
  urls[path] = blobUrl(code.replace(IMPORT, (all, before, quote, spec) => {
    const target = resolvePath(path, spec);
    return before + JSON.stringify(urls[target] ?? `~/${target}`);
  }));
  return urls;
}
async function withoutHarness(use) {
  const saved = HARNESS.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]);
  for (const name of HARNESS) delete window[name];
  try {
    return await use();
  } finally {
    for (const [name, descriptor] of saved) if (descriptor) Object.defineProperty(window, name, descriptor);
  }
}
/** Runs the learner's suite with `code` as the module SWAP. */
async function runSuite(code) {
  try {
    const urls = moduleUrls(SUITE, { [SWAP]: code, [RUNNER]: TESTING });
    return await withoutHarness(async () => {
      await import(urls[SUITE]);
      const runner = await import(urls[RUNNER]);
      return { results: await runner.run({ print: false }) };
    });
  } catch (error) {
    return { error: `${error?.name}: ${error?.message}` };
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectPassesOnCorrect() {
  const run = await runSuite(CORRECT);
  expect(run.error ?? null, `an error while ${SUITE} ran with the course's ${SWAP}`).toBeNull();
  expect(run.results.length, `the number of tests in ${SUITE}`).toBeGreaterThan(0);
  expect(failing(run.results), `your tests that fail with the course's ${SWAP}`).toEqual([]);
}
async function expectCatches(code, defect) {
  await expectPassesOnCorrect();
  const run = await runSuite(code);
  const caught = run.error !== undefined || run.results.some((result) => !result.passed);
  expect(caught, `a failing test of yours when ${SWAP} ${defect}`).toBe(true);
}

/** Runs `body` with a fake clock: timers wait in `clock.pending` until the check runs them. */
async function withFakeClock(body) {
  const real = { setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, setInterval: window.setInterval, clearInterval: window.clearInterval };
  const pending = new Map();
  let next = 0;
  const schedule = (fn, ms, repeat) => {
    const id = `fake-${(next += 1)}`;
    if (typeof fn === 'function') pending.set(id, { fn, ms: Number(ms) || 0, repeat });
    return id;
  };
  window.setTimeout = (fn, ms) => schedule(fn, ms, false);
  window.setInterval = (fn, ms) => schedule(fn, ms, true);
  window.clearTimeout = (id) => { pending.delete(id); };
  window.clearInterval = (id) => { pending.delete(id); };
  const clock = {
    get pending() { return pending.size; },
    runAll() {
      for (const [id, timer] of [...pending]) {
        if (!timer.repeat) pending.delete(id);
        timer.fn();
      }
    },
  };
  try {
    return await body(clock);
  } finally {
    Object.assign(window, real);
  }
}
const searchField = () => [...document.querySelectorAll('input')].find((node) => inOrder(screen.nameOf(node), L.searchLabel)) ?? null;
const filterField = () => [...document.querySelectorAll('select')].find((node) => inOrder(screen.nameOf(node), L.filterLabel)) ?? null;
function typeSearch(text) {
  const node = searchField();
  for (let length = 1; length <= text.length; length += 1) {
    node.value = text.slice(0, length);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
async function addThroughForm() {
  await setValue(field(L.nameLabel), L.newName);
  await user.submit(form());
}
/** Runs `body` with the page address changed to `search`, then puts the original address back. */
async function withAddress(search, body) {
  const original = location.href;
  try {
    return await body(original);
  } finally {
    history.replaceState(null, '', original);
  }
}
/** The original address with these query parameters set (the other parameters stay). */
function addressWith(original, params) {
  const url = new URL(original);
  url.searchParams.delete('q');
  url.searchParams.delete('show');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.href;
}
const queryParam = (name) => new URLSearchParams(location.search).get(name);
/** Every key of the check's storage. */
function storageKeys() {
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) keys.push(storage.key(index));
  return keys.sort();
}

// ---------- checks: the address ----------

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('readView reads the search and the filter of an address', async () => {
  const { readView } = await moduleWith('./' + ADDRESS, ['readView']);
  const encoded = new URLSearchParams({ q: 'Дім & сад #1', show: 'paused' }).toString();
  expect(readView('?' + encoded, FILTERS), `readView("?${encoded}")`).toEqual({ query: 'Дім & сад #1', filter: 'paused' });
  expect(readView('?id=7&net=lab', FILTERS), 'readView of an address with other parameters only').toEqual({ query: '', filter: 'all' });
  expect(readView('', FILTERS), 'readView("")').toEqual({ query: '', filter: 'all' });
  expect(readView('?show=%3Cb%3Ex%3C%2Fb%3E', FILTERS), 'readView of an unknown filter "<b>x</b>"').toEqual({ query: '', filter: 'all' });
  expect(readView('?q=a%2Bb+c', FILTERS).query, 'the search of "?q=a%2Bb+c"').toBe('a+b c');
});

test('viewAddress writes the view and keeps the rest of the address', async () => {
  const { viewAddress, readView } = await moduleWith('./' + ADDRESS, ['viewAddress', 'readView']);
  const base = 'http://jsll-run-0.localhost:7300/sandbox/frame.html?id=7&net=lab';
  const view = { query: 'Дім & сад #1 100%', filter: 'paused' };
  const written = new URL(viewAddress(base, view));
  expect(written.pathname, 'the path of the written address').toBe('/sandbox/frame.html');
  expect([written.searchParams.get('id'), written.searchParams.get('net')], 'the other parameters id and net').toEqual(['7', 'lab']);
  expect(written.hash, 'the fragment of the written address (a "#" in the search must be encoded)').toBe('');
  expect(readView(written.search, FILTERS), 'the view read back from the written address').toEqual(view);
  const clean = new URL(viewAddress(written.href, { query: '', filter: 'all' }));
  expect([clean.searchParams.has('q'), clean.searchParams.has('show')], 'q and show after an empty search and the filter all').toEqual([false, false]);
});

// ---------- checks: the page ----------

test('the search and the filter go into the page address', async () => {
  await withAddress('', async (original) => {
    await startPage(null);
    // A new history entry per search would make Back step through searches: count pushState calls.
    const pushState = history.pushState;
    let pushes = 0;
    history.pushState = function (...args) {
      pushes += 1;
      return pushState.apply(this, args);
    };
    try {
      await withFakeClock(async (clock) => {
        typeSearch(L.fixture5Name);
        clock.runAll();
      });
      expect(await until(() => queryParam('q') === L.fixture5Name), `the parameter q of the page address after a search for "${L.fixture5Name}" (now: ${location.search})`).toBe(true);
      await user.select(filterField(), 'paused');
      expect(await until(() => queryParam('show') === 'paused'), `the parameter show after the filter "paused" (now: ${location.search})`).toBe(true);
      expect(new URL(location.href).searchParams.get('id'), 'the parameter id of the platform in the page address').toBe(new URL(original).searchParams.get('id'));
      expect(pushes, 'history.pushState calls for the search and the filter (replaceState adds no history entry)').toBe(0);
    } finally {
      history.pushState = pushState;
    }
  });
});


test('a restart shows the view written in the address', async () => {
  await withAddress('', async (original) => {
    const page = await moduleWith(PAGE, ['start']);
    storage.clear();
    storage.setItem(KEY, saved(fixtures()));
    history.replaceState(null, '', addressWith(original, { q: L.fixture5Name }));
    page.start(storage);
    expect(await until(() => cardIds().join() === 'h-05'), `only the card h-05 after a start with ?q=${L.fixture5Name}`).toBe(true);
    expect(searchField()?.value, 'the value of the search field after that start').toBe(L.fixture5Name);
    history.replaceState(null, '', addressWith(original, { show: 'paused' }));
    page.start(storage);
    expect(await until(() => cardIds().join() === ['h-05'].join()), `the cards ['h-05'] after a start with ?show=paused`).toBe(true);
    expect(filterField()?.value, 'the value of the filter after that start').toBe('paused');
  });
});

test('an address with markup or an unknown filter is not trusted', async () => {
  await withAddress('', async (original) => {
    const page = await moduleWith(PAGE, ['start']);
    storage.clear();
    storage.setItem(KEY, saved(fixtures()));
    const images = document.querySelectorAll('img').length;
    const markup = '<img src="x" onerror="window.__jsllAddressMarkup = 1">';
    history.replaceState(null, '', addressWith(original, { q: markup, show: '<b>x</b>' }));
    page.start(storage);
    await settle();
    expect(filterField()?.value, 'the value of the filter after a start with ?show=<b>x</b>').toBe('all');
    expect(searchField()?.value, 'the value of the search field after a start with markup in ?q').toBe(markup);
    expect(document.querySelectorAll('img').length, 'the number of img elements on the page').toBe(images);
    expect(window.__jsllAddressMarkup, 'a value set by markup in the address').toBeUndefined();
  });
});

// ---------- checks: the network ----------

test('loadFixtures tries once more after a network failure', async () => {
  const { loadFixtures } = await moduleWith(DATA, ['loadFixtures']);
  const attempt = async (answers) => {
    let calls = 0;
    const mock = mockFetch(() => answers[Math.min((calls += 1) - 1, answers.length - 1)]);
    try {
      const value = await loadFixtures(new AbortController().signal);
      return { calls, result: `resolves with ${value.length} records` };
    } catch (error) {
      return { calls, result: `rejects with ${error?.name}` };
    } finally {
      mock.restore();
    }
  };
  const file = { status: 200, body: { schemaVersion: 1, records: fixtures() } };
  expect(await attempt([{ networkError: true }, file]), 'a network failure, then the file').toEqual({ calls: 2, result: 'resolves with 6 records' });
  expect(await attempt([{ networkError: true }]), 'a network failure every time').toEqual({ calls: 2, result: 'rejects with TypeError' });
  expect(await attempt([{ status: 500, body: 'Server error' }, file]), 'the answer 500, then the file').toEqual({ calls: 1, result: 'rejects with Error' });
});

test('an aborted load is not tried again', async () => {
  const { loadFixtures } = await moduleWith(DATA, ['loadFixtures']);
  let calls = 0;
  const mock = mockFetch(() => {
    calls += 1;
    return { status: 200, body: { schemaVersion: 1, records: fixtures() }, delay: 300 };
  });
  const controller = new AbortController();
  let result = null;
  try {
    const loading = loadFixtures(controller.signal);
    await sleep(20);
    controller.abort();
    await loading;
    result = 'resolves';
  } catch (error) {
    result = `rejects with ${error?.name}`;
  } finally {
    await sleep(320);
    mock.restore();
  }
  expect({ calls, result }, 'loadFixtures aborted during the request').toEqual({ calls: 1, result: 'rejects with AbortError' });
});

test('a name with markup from the file stays text', async () => {
  const markup = '<img src="x" onerror="window.__jsllFileMarkup = 1"><b>!</b>';
  const records = fixtures();
  records[0] = { ...records[0], [NAME]: markup };
  const mock = mockFetch(() => ({ status: 200, body: { schemaVersion: 1, records } }));
  try {
    await startPage(null);
    expect(card('h-01')?.querySelector('h3')?.textContent, 'the heading of the card h-01').toBe(markup);
    expect(card('h-01')?.querySelectorAll('img, b').length, 'img and b elements inside the card h-01').toBe(0);
    expect(window.__jsllFileMarkup, 'a value set by markup in the file').toBeUndefined();
  } finally {
    mock.restore();
  }
});

test('the page stores nothing but its own records', async () => {
  await withAddress('', async () => {
    await startPage(null);
    await addThroughForm();
    await withFakeClock(async (clock) => {
      typeSearch(L.newName);
      clock.runAll();
    });
    await user.select(filterField(), 'paused');
    await settle();
    const keys = storageKeys();
    expect(keys.includes(KEY), `the key ${KEY} after a new habit was saved`).toBe(true);
    expect(keys.filter((key) => key !== KEY && key !== BACKUP), 'other keys in the storage').toEqual([]);
  });
});

// ---------- checks: the learner's tests ----------

test('your address tests pass with a correct address module', async () => {
  await expectPassesOnCorrect();
});

test('your tests catch an address written without encoding', async () => {
  await expectCatches(BROKEN.noEncoding, 'has a viewAddress that glues "q=" and the search to the address without encoding');
});

test('your tests catch a readView that trusts any filter', async () => {
  await expectCatches(BROKEN.anyFilter, 'has a readView that takes any show value from the address');
});

test('run-tests.js runs the address tests too', async () => {
  await expectPassesOnCorrect();
  const exitCodes = [];
  for (const code of [CORRECT, BROKEN.noEncoding]) {
    let urls = null;
    try {
      urls = moduleUrls(DRIVER, { [SWAP]: code, [RUNNER]: TESTING });
    } catch (error) {
      urls = null;
    }
    expect(urls !== null, `the file ${DRIVER}`).toBe(true);
    const fakeProcess = { exitCode: undefined, env: {}, argv: [] };
    const result = await withoutHarness(async () => {
      Object.defineProperty(window, 'process', { value: fakeProcess, configurable: true, writable: true });
      try {
        await import(urls[DRIVER]);
        return null;
      } catch (error) {
        return `${error?.name}: ${error?.message}`;
      } finally {
        delete window.process;
      }
    });
    expect(result, `an error while ${DRIVER} ran with a \`process\` like the one of Node.js`).toBeNull();
    exitCodes.push(fakeProcess.exitCode ?? 0);
  }
  expect(exitCodes[0], `process.exitCode after ${DRIVER} with a correct ${ADDRESS}`).not.toBe(1);
  expect(exitCodes[1], `process.exitCode after ${DRIVER} with an ${ADDRESS} that does not encode`).toBe(1);
});

test('run-tests.js prints the results on the page', () => {
  const pattern = new RegExp(`^${L.rSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{passed\\}', '(\\d+)').replace('\\{failed\\}', '(\\d+)')}$`);
  const summary = logs().map((line) => pattern.exec(line.trim())).find((match) => match !== null) ?? null;
  expect(summary !== null, `a line "${L.rSummary}" in the console after the page started`).toBe(true);
  expect(Number(summary[1]), 'the number of passed tests in that line').toBeGreaterThan(0);
  expect(Number(summary[2]), 'the number of failed tests in that line').toBe(0);
});
