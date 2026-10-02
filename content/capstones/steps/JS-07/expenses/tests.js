// Checks of capstone step JS-07, expenses variant: the rules live in domain/expenses.js, saving and loading in
// storage/expenses.js, every change on the page is saved as { schemaVersion: 1, records }, a restart
// (app.js runs again) shows the saved expenses, and damaged saved data shows a message and the
// starting list while its text is kept under the backup key. The checks run one after another on
// the same page and start with an empty storage.
const KEY = 'jsll.expenses.v1';
const BACKUP = 'jsll.expenses.v1.backup';
const DOMAIN = './domain/expenses.js';
const STORAGE = './storage/expenses.js';

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
const form = () => screen.$('form');
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
/** Fills the form with a valid draft named `name` and submits it. */
async function addThroughForm(name) {
  await setValue(field(L.nameLabel), name);
  await setValue(field(L.valueLabel), '19.99');
  await setValue(field(L.dateFieldLabel), '2026-03-02');
  await setValue(field(L.categoryFieldLabel), 'transport');
  await user.submit(form());
}
const list = () => screen.$('#expenses');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const cardIds = () => cards().map((node) => node.dataset.id);
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const statusText = () => screen.$('[role="status"]')?.textContent ?? '';
/** `record` has every field of `fields` with the same value (the id and the field order do not matter). */
const hasFields = (record, fields) => Object.entries(fields).every(([name, value]) => JSON.stringify(record?.[name]) === JSON.stringify(value));

const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
// Saved expenses of an earlier session; "e-7" and "e-8" are ids a counter starting at 7 gives again.
const savedSample = () => [
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-7', label: L.newName, amountMinor: 1999, date: '2026-03-02', category: 'transport' },
  { id: 'e-8', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
];
const saved = (records, version = 1) => JSON.stringify({ schemaVersion: version, records });
const UNPARSABLE = ['{bad', saved(savedSample()).slice(0, -2)];
const WRONG_VERSION = [saved(savedSample(), 2), JSON.stringify({ schemaVersion: 1, records: 'e-01' }), 'null', JSON.stringify(savedSample())];
const INVALID_RECORD = [
  saved([...savedSample(), { id: 'e-09', amountMinor: 500, date: '2026-03-01', category: 'food' }]),
  saved([{ id: 'e-10', label: L.fixture1Name, amountMinor: 845.5, date: '2026-03-01', category: 'food' }]),
  saved([{ id: 'e-11', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'travel' }]),
];
const short = (text) => (text.length > 60 ? text.slice(0, 57) + '…' : text);

// Runs `use()` with only `text` saved under the key (nothing when text is null), then puts the
// storage back exactly as it was.
async function withStored(text, use) {
  const before = {};
  for (let i = 0; i < storage.length; i += 1) before[storage.key(i)] = storage.getItem(storage.key(i));
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  try {
    return await use();
  } finally {
    storage.clear();
    for (const [key, value] of Object.entries(before)) storage.setItem(key, value);
  }
}
/** Starts the project again (app.js runs again) with only `text` saved; the storage stays as the page left it. */
async function restartWith(text) {
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  const run = await rerun();
  await settle();
  return run.error === null ? null : `${run.error.name}: ${run.error.message}`;
}
const savedValue = () => {
  try {
    return JSON.parse(storage.getItem(KEY));
  } catch (error) {
    return null;
  }
};

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('domain/expenses.js exports the rules and the starting list', async () => {
  const domain = await moduleWith(DOMAIN, ['validateExpense', 'addExpense', 'updateExpense', 'removeExpense', 'summarizeExpenses']);
  expect(domain.expenses, 'the named export expenses of domain/expenses.js').toEqual(fixtures());
  expect(domain.validateExpense({ label: ' ', amountMinor: 845.5, date: '2026-03-01', category: 'travel' }), 'validateExpense({ label: " ", amountMinor: 845.5, date: "2026-03-01", category: "travel" })').toEqual({ ok: false, errors: { label: 'required', amountMinor: 'not-positive-integer', category: 'unknown' } });
});

test('the other modules use the domain functions instead of copies', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  const store = (await load(STORAGE)).module ?? {};
  const shared = { ...Object.fromEntries(['validateExpense', 'addExpense', 'updateExpense', 'removeExpense', 'summarizeExpenses'].map((name) => [name, domain[name]])), loadExpenses: store.loadExpenses, saveExpenses: store.saveExpenses };
  const own = { [DOMAIN.slice(2)]: Object.keys(domain), [STORAGE.slice(2)]: Object.keys(store) };
  const scripts = Object.keys(files).filter((path) => path.endsWith('.js'));
  expect(scripts.some((path) => path.startsWith('ui/')), 'a .js file in the folder ui/').toBe(true);
  for (const path of scripts) {
    const bindings = scopeOf(path);
    for (const [name, fromModule] of Object.entries(shared)) {
      if (typeof fromModule !== 'function' || (own[path] ?? []).includes(name) || !(name in bindings)) continue;
      expect(bindings[name] === fromModule, `${name} in ${path} is the function its module exports`).toBe(true);
    }
  }
});

test('with nothing saved the page shows the six expenses and no message', () => {
  expect(cardIds(), 'the data-id of the cards on a first start').toEqual(fixtures().map((record) => record.id));
  expect(screen.$('[role="status"]'), 'an element with role="status" for the load message').toBeTruthy();
  expect(statusText().trim(), 'the text of the role="status" element on a first start').toBe('');
});

test('a change on the page is saved with schemaVersion 1', async () => {
  await addThroughForm(L.newName);
  const afterAdd = savedValue();
  expect(afterAdd?.schemaVersion, `schemaVersion in the JSON under "${KEY}" after adding an expense`).toBe(1);
  expect(Array.isArray(afterAdd?.records) ? afterAdd.records.length : null, 'the number of saved records after adding an expense').toBe(7);
  expect(afterAdd.records.some((record) => hasFields(record, { label: L.newName, amountMinor: 1999, date: '2026-03-02', category: 'transport' })), `a saved record with ${JSON.stringify({ label: L.newName, amountMinor: 1999, date: '2026-03-02', category: 'transport' })}`).toBe(true);
  await user.click(buttonIn(card('e-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('e-03'), L.confirmDeleteLabel));
  const afterDelete = savedValue();
  expect(afterDelete?.records?.map((record) => record.id).includes('e-03'), 'e-03 among the saved records after its confirmed delete').toBe(false);
  expect(afterDelete?.records?.length, 'the number of saved records after the delete').toBe(6);
});

test('loadExpenses reads valid saved expenses', async () => {
  const { loadExpenses } = await moduleWith(STORAGE, ['loadExpenses']);
  await withStored(saved(savedSample()), () => {
    expect(loadExpenses(storage), 'loadExpenses for three valid saved expenses').toEqual({ ok: true, expenses: savedSample() });
  });
});

test('loadExpenses reports missing data without a backup', async () => {
  const { loadExpenses } = await moduleWith(STORAGE, ['loadExpenses']);
  await withStored(null, () => {
    expect(loadExpenses(storage), 'loadExpenses when nothing is saved').toEqual({ ok: false, reason: 'missing' });
    expect(storage.getItem(BACKUP), 'the backup key when nothing is saved').toBeNull();
  });
});

test('loadExpenses names what is wrong with damaged data', async () => {
  const { loadExpenses } = await moduleWith(STORAGE, ['loadExpenses']);
  const cases = [...UNPARSABLE.map((text) => [text, 'unparsable']), ...WRONG_VERSION.map((text) => [text, 'wrong-version']), ...INVALID_RECORD.map((text) => [text, 'invalid-record'])];
  for (const [text, reason] of cases) {
    await withStored(text, () => {
      let result;
      try {
        result = loadExpenses(storage);
      } catch (error) {
        result = `it threw ${error.name}: ${error.message}`;
      }
      expect(result, `loadExpenses for ${short(text)}`).toEqual({ ok: false, reason });
    });
  }
});

test('damaged data stays saved and is copied under the backup key', async () => {
  const { loadExpenses } = await moduleWith(STORAGE, ['loadExpenses']);
  const valid = saved(savedSample());
  for (const text of [valid, ...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    await withStored(text, () => {
      try {
        loadExpenses(storage);
      } catch (error) {
        // The previous check reports a throwing loadExpenses.
      }
      expect(storage.getItem(KEY), `the text under "${KEY}" after loading ${short(text)}`).toBe(text);
      if (text !== valid) expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after loading ${short(text)}`).toBe(text);
    });
  }
});

test('saveExpenses saves the expenses with schemaVersion 1', async () => {
  const { saveExpenses } = await moduleWith(STORAGE, ['saveExpenses']);
  await withStored(null, () => {
    saveExpenses(storage, savedSample());
    expect(savedValue(), `the JSON under "${KEY}" after saveExpenses(storage, three expenses)`).toEqual({ schemaVersion: 1, records: savedSample() });
  });
});

test('damaged saved data shows the message and the starting expenses after a restart', async () => {
  for (const text of [UNPARSABLE[0], WRONG_VERSION[0], INVALID_RECORD[0]]) {
    expect(await restartWith(text), `an error while app.js ran again with ${short(text)} saved`).toBeNull();
    expect(inOrder(statusText(), L.loadErrorMessage), `"${L.loadErrorMessage}" in the role="status" element after a restart with ${short(text)} saved`).toBe(true);
    expect(cardIds(), `the data-id of the cards after a restart with ${short(text)} saved`).toEqual(fixtures().map((record) => record.id));
    expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after that restart`).toBe(text);
  }
});

test('saved expenses come back after a restart, without the message', async () => {
  expect(await restartWith(saved(savedSample())), 'an error while app.js ran again with three valid expenses saved').toBeNull();
  expect(cardIds(), 'the data-id of the cards after a restart with e-02, e-7 and e-8 saved').toEqual(['e-02', 'e-7', 'e-8']);
  for (const parts of [[L.fixture2Name, `520${L.decimalMark}00`], [L.categoryTransport]]) {
    expect(inOrder(card('e-02')?.textContent, ...parts), `the card e-02 shows ${parts.map((part) => `"${part}"`).join(', then ')}`).toBe(true);
  }
  expect(statusText().trim(), 'the text of the role="status" element after a restart with valid data').toBe('');
});

test('an expense added after a restart gets an id no other expense has', async () => {
  await addThroughForm(L.fixture1Name);
  const ids = savedValue()?.records?.map((record) => record.id) ?? [];
  expect(ids.length, 'the number of saved records after adding an expense to e-02, e-7 and e-8').toBe(4);
  expect(new Set(ids).size, `different ids among the saved ids ${JSON.stringify(ids)}`).toBe(ids.length);
  expect(cards().length, 'the number of cards after that').toBe(4);
});

test('expenses stays the starting list', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  expect(domain.expenses, 'expenses of domain/expenses.js after all actions and restarts').toEqual(fixtures());
});
