// Checks of capstone step JS-07, habits variant: the rules live in domain/habits.js, saving and loading in
// storage/habits.js, every change on the page is saved as { schemaVersion: 1, records }, a restart
// (app.js runs again) shows the saved habits, and damaged saved data shows a message and the
// starting list while its text is kept under the backup key. The checks run one after another on
// the same page and start with an empty storage.
const KEY = 'jsll.habits.v1';
const BACKUP = 'jsll.habits.v1.backup';
const DOMAIN = './domain/habits.js';
const STORAGE = './storage/habits.js';

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
  await setValue(field(L.valueLabel), 'weekly');
  await user.submit(form());
}
const list = () => screen.$('#habits');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const cardIds = () => cards().map((node) => node.dataset.id);
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const statusText = () => screen.$('[role="status"]')?.textContent ?? '';
/** `record` has every field of `fields` with the same value (the id and the field order do not matter). */
const hasFields = (record, fields) => Object.entries(fields).every(([name, value]) => JSON.stringify(record?.[name]) === JSON.stringify(value));

const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
// Saved habits of an earlier session; "h-7" and "h-8" are ids a counter starting at 7 gives again.
const savedSample = () => [
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: false, completions: ['2026-02-28', '2026-03-01'] },
  { id: 'h-7', name: L.newName, frequency: 'weekly', active: true, completions: [] },
  { id: 'h-8', name: L.fixture6Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
];
const saved = (records, version = 1) => JSON.stringify({ schemaVersion: version, records });
const UNPARSABLE = ['{bad', saved(savedSample()).slice(0, -2)];
const WRONG_VERSION = [saved(savedSample(), 2), JSON.stringify({ schemaVersion: 1, records: 'h-01' }), 'null', JSON.stringify(savedSample())];
const INVALID_RECORD = [
  saved([...savedSample(), { id: 'h-09', frequency: 'daily', active: true, completions: [] }]),
  saved([{ id: 'h-10', name: L.fixture1Name, frequency: 'daily', active: true, completions: '2026-03-01' }]),
  saved([{ id: 'h-11', name: L.fixture1Name, frequency: 'daily', active: 'yes', completions: [] }]),
  // Every damage the task names: a record that is not an object, an id that is not text, and the
  // type rule of the variant's own field.
  saved([...savedSample(), null]),
  saved([{ ...savedSample()[1], id: 12 }]),
  saved([{ ...savedSample()[1], completions: [20260301] }]),
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

test('domain/habits.js exports the rules and the starting list', async () => {
  const domain = await moduleWith(DOMAIN, ['validateHabit', 'addHabit', 'updateHabit', 'removeHabit', 'completeHabit']);
  expect(domain.habits, 'the named export habits of domain/habits.js').toEqual(fixtures());
  expect(domain.validateHabit({ name: ' ', frequency: 'monthly' }), 'validateHabit({ name: " ", frequency: "monthly" })').toEqual({ ok: false, errors: { name: 'required', frequency: 'unknown' } });
});

test('the other modules use the domain functions instead of copies', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  const store = (await load(STORAGE)).module ?? {};
  const shared = { ...Object.fromEntries(['validateHabit', 'addHabit', 'updateHabit', 'removeHabit', 'completeHabit'].map((name) => [name, domain[name]])), loadHabits: store.loadHabits, saveHabits: store.saveHabits };
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

test('with nothing saved the page shows the six habits and no message', () => {
  expect(cardIds(), 'the data-id of the cards on a first start').toEqual(fixtures().map((record) => record.id));
  expect(screen.$('[role="status"]'), 'an element with role="status" for the load message').toBeTruthy();
  expect(statusText().trim(), 'the text of the role="status" element on a first start').toBe('');
});

test('a change on the page is saved with schemaVersion 1', async () => {
  await addThroughForm(L.newName);
  const afterAdd = savedValue();
  expect(afterAdd?.schemaVersion, `schemaVersion in the JSON under "${KEY}" after adding a habit`).toBe(1);
  expect(Array.isArray(afterAdd?.records) ? afterAdd.records.length : null, 'the number of saved records after adding a habit').toBe(7);
  expect(afterAdd.records.some((record) => hasFields(record, { name: L.newName, frequency: 'weekly', active: true, completions: [] })), `a saved record with ${JSON.stringify({ name: L.newName, frequency: 'weekly', active: true, completions: [] })}`).toBe(true);
  await user.click(buttonIn(card('h-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('h-03'), L.confirmDeleteLabel));
  const afterDelete = savedValue();
  expect(afterDelete?.records?.map((record) => record.id).includes('h-03'), 'h-03 among the saved records after its confirmed delete').toBe(false);
  expect(afterDelete?.records?.length, 'the number of saved records after the delete').toBe(6);
});

test('an edit on the page is saved', async () => {
  await user.click(buttonIn(card('h-02'), L.editLabel));
  await setValue(field(L.nameLabel), 'Edited on the page');
  await user.submit(form());
  const record = savedValue()?.records?.find((one) => one.id === 'h-02');
  expect(record?.name, `the saved name of h-02 after editing it on the page`).toBe('Edited on the page');
});

test('loadHabits reads valid saved habits', async () => {
  const { loadHabits } = await moduleWith(STORAGE, ['loadHabits']);
  await withStored(saved(savedSample()), () => {
    expect(loadHabits(storage), 'loadHabits for three valid saved habits').toEqual({ ok: true, habits: savedSample() });
  });
});

test('loadHabits reports missing data without a backup', async () => {
  const { loadHabits } = await moduleWith(STORAGE, ['loadHabits']);
  await withStored(null, () => {
    expect(loadHabits(storage), 'loadHabits when nothing is saved').toEqual({ ok: false, reason: 'missing' });
    expect(storage.getItem(BACKUP), 'the backup key when nothing is saved').toBeNull();
  });
});

test('loadHabits names what is wrong with damaged data', async () => {
  const { loadHabits } = await moduleWith(STORAGE, ['loadHabits']);
  const cases = [...UNPARSABLE.map((text) => [text, 'unparsable']), ...WRONG_VERSION.map((text) => [text, 'wrong-version']), ...INVALID_RECORD.map((text) => [text, 'invalid-record'])];
  for (const [text, reason] of cases) {
    await withStored(text, () => {
      let result;
      try {
        result = loadHabits(storage);
      } catch (error) {
        result = `it threw ${error.name}: ${error.message}`;
      }
      expect(result, `loadHabits for ${short(text)}`).toEqual({ ok: false, reason });
    });
  }
});

test('damaged data stays saved and is copied under the backup key', async () => {
  const { loadHabits } = await moduleWith(STORAGE, ['loadHabits']);
  const valid = saved(savedSample());
  for (const text of [valid, ...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    await withStored(text, () => {
      try {
        loadHabits(storage);
      } catch (error) {
        // The previous check reports a throwing loadHabits.
      }
      expect(storage.getItem(KEY), `the text under "${KEY}" after loading ${short(text)}`).toBe(text);
      if (text !== valid) expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after loading ${short(text)}`).toBe(text);
    });
  }
});

test('saveHabits saves the habits with schemaVersion 1', async () => {
  const { saveHabits } = await moduleWith(STORAGE, ['saveHabits']);
  await withStored(null, () => {
    saveHabits(storage, savedSample());
    expect(savedValue(), `the JSON under "${KEY}" after saveHabits(storage, three habits)`).toEqual({ schemaVersion: 1, records: savedSample() });
  });
});

test('damaged saved data shows the message and the starting habits after a restart', async () => {
  for (const text of [UNPARSABLE[0], WRONG_VERSION[0], INVALID_RECORD[0]]) {
    expect(await restartWith(text), `an error while app.js ran again with ${short(text)} saved`).toBeNull();
    expect(inOrder(statusText(), L.loadErrorMessage), `"${L.loadErrorMessage}" in the role="status" element after a restart with ${short(text)} saved`).toBe(true);
    expect(cardIds(), `the data-id of the cards after a restart with ${short(text)} saved`).toEqual(fixtures().map((record) => record.id));
    expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after that restart`).toBe(text);
  }
});

test('saved habits come back after a restart, without the message', async () => {
  expect(await restartWith(saved(savedSample())), 'an error while app.js ran again with three valid habits saved').toBeNull();
  expect(cardIds(), 'the data-id of the cards after a restart with h-02, h-7 and h-8 saved').toEqual(['h-02', 'h-7', 'h-8']);
  for (const parts of [[L.fixture2Name, L.completionsLabel, '2'], [L.pausedMark]]) {
    expect(inOrder(card('h-02')?.textContent, ...parts), `the card h-02 shows ${parts.map((part) => `"${part}"`).join(', then ')}`).toBe(true);
  }
  expect(statusText().trim(), 'the text of the role="status" element after a restart with valid data').toBe('');
});

test('a habit added after a restart gets an id no other habit has', async () => {
  await addThroughForm(L.fixture1Name);
  const ids = savedValue()?.records?.map((record) => record.id) ?? [];
  expect(ids.length, 'the number of saved records after adding a habit to h-02, h-7 and h-8').toBe(4);
  expect(new Set(ids).size, `different ids among the saved ids ${JSON.stringify(ids)}`).toBe(ids.length);
  expect(cards().length, 'the number of cards after that').toBe(4);
  const nameField = field(L.nameLabel);
  const message = (nameField?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
  expect(message, 'the message next to the name field after a valid add (a second submit handler, added by a second start, sees the cleared form)').toBe('');
});

test('habits stays the starting list', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  expect(domain.habits, 'habits of domain/habits.js after all actions and restarts').toEqual(fixtures());
});
