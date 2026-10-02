// Checks of capstone step JS-07, planner variant: the rules live in domain/tasks.js, saving and loading in
// storage/tasks.js, every change on the page is saved as { schemaVersion: 1, records }, a restart
// (app.js runs again) shows the saved tasks, and damaged saved data shows a message and the
// starting list while its text is kept under the backup key. The checks run one after another on
// the same page and start with an empty storage.
const KEY = 'jsll.planner.v1';
const BACKUP = 'jsll.planner.v1.backup';
const DOMAIN = './domain/tasks.js';
const STORAGE = './storage/tasks.js';

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
  await setValue(field(L.valueLabel), '2026-03-01');
  await setValue(field(L.priorityFieldLabel), 'high');
  await user.submit(form());
}
const list = () => screen.$('#tasks');
const cards = () => [...(list()?.querySelectorAll('[data-id]') ?? [])];
const cardIds = () => cards().map((node) => node.dataset.id);
const card = (id) => cards().find((node) => node.dataset.id === id) ?? null;
const buttonIn = (node, label, unless = null) => [...(node?.querySelectorAll('button') ?? [])].find((button) => inOrder(screen.nameOf(button), label) && !(unless !== null && inOrder(screen.nameOf(button), unless))) ?? null;
const statusText = () => screen.$('[role="status"]')?.textContent ?? '';
/** `record` has every field of `fields` with the same value (the id and the field order do not matter). */
const hasFields = (record, fields) => Object.entries(fields).every(([name, value]) => JSON.stringify(record?.[name]) === JSON.stringify(value));

const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];
// Saved tasks of an earlier session; "t-7" and "t-8" are ids a counter starting at 7 gives again.
const savedSample = () => [
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: true, priority: 'high' },
  { id: 't-7', title: L.newName, dueDate: null, done: false, priority: 'normal' },
  { id: 't-8', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'low' },
];
const saved = (records, version = 1) => JSON.stringify({ schemaVersion: version, records });
const UNPARSABLE = ['{bad', saved(savedSample()).slice(0, -2)];
const WRONG_VERSION = [saved(savedSample(), 2), JSON.stringify({ schemaVersion: 1, records: 't-01' }), 'null', JSON.stringify(savedSample())];
const INVALID_RECORD = [
  saved([...savedSample(), { id: 't-09', dueDate: null, done: false, priority: 'low' }]),
  saved([{ id: 't-10', title: L.fixture1Name, dueDate: null, done: 'no', priority: 'low' }]),
  saved([{ id: 't-11', title: L.fixture1Name, dueDate: null, done: false, priority: 'urgent' }]),
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

test('domain/tasks.js exports the rules and the starting list', async () => {
  const domain = await moduleWith(DOMAIN, ['validateTask', 'addTask', 'updateTask', 'removeTask', 'countDueTasks']);
  expect(domain.tasks, 'the named export tasks of domain/tasks.js').toEqual(fixtures());
  expect(domain.validateTask({ title: ' ', priority: 'urgent' }), 'validateTask({ title: " ", priority: "urgent" })').toEqual({ ok: false, errors: { title: 'required', priority: 'unknown' } });
});

test('the other modules use the domain functions instead of copies', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  const store = (await load(STORAGE)).module ?? {};
  const shared = { ...Object.fromEntries(['validateTask', 'addTask', 'updateTask', 'removeTask', 'countDueTasks'].map((name) => [name, domain[name]])), loadTasks: store.loadTasks, saveTasks: store.saveTasks };
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

test('with nothing saved the page shows the six tasks and no message', () => {
  expect(cardIds(), 'the data-id of the cards on a first start').toEqual(fixtures().map((record) => record.id));
  expect(screen.$('[role="status"]'), 'an element with role="status" for the load message').toBeTruthy();
  expect(statusText().trim(), 'the text of the role="status" element on a first start').toBe('');
});

test('a change on the page is saved with schemaVersion 1', async () => {
  await addThroughForm(L.newName);
  const afterAdd = savedValue();
  expect(afterAdd?.schemaVersion, `schemaVersion in the JSON under "${KEY}" after adding a task`).toBe(1);
  expect(Array.isArray(afterAdd?.records) ? afterAdd.records.length : null, 'the number of saved records after adding a task').toBe(7);
  expect(afterAdd.records.some((record) => hasFields(record, { title: L.newName, dueDate: '2026-03-01', done: false, priority: 'high' })), `a saved record with ${JSON.stringify({ title: L.newName, dueDate: '2026-03-01', done: false, priority: 'high' })}`).toBe(true);
  await user.click(buttonIn(card('t-03'), L.deleteLabel, L.confirmDeleteLabel));
  await user.click(buttonIn(card('t-03'), L.confirmDeleteLabel));
  const afterDelete = savedValue();
  expect(afterDelete?.records?.map((record) => record.id).includes('t-03'), 't-03 among the saved records after its confirmed delete').toBe(false);
  expect(afterDelete?.records?.length, 'the number of saved records after the delete').toBe(6);
});

test('loadTasks reads valid saved tasks', async () => {
  const { loadTasks } = await moduleWith(STORAGE, ['loadTasks']);
  await withStored(saved(savedSample()), () => {
    expect(loadTasks(storage), 'loadTasks for three valid saved tasks').toEqual({ ok: true, tasks: savedSample() });
  });
});

test('loadTasks reports missing data without a backup', async () => {
  const { loadTasks } = await moduleWith(STORAGE, ['loadTasks']);
  await withStored(null, () => {
    expect(loadTasks(storage), 'loadTasks when nothing is saved').toEqual({ ok: false, reason: 'missing' });
    expect(storage.getItem(BACKUP), 'the backup key when nothing is saved').toBeNull();
  });
});

test('loadTasks names what is wrong with damaged data', async () => {
  const { loadTasks } = await moduleWith(STORAGE, ['loadTasks']);
  const cases = [...UNPARSABLE.map((text) => [text, 'unparsable']), ...WRONG_VERSION.map((text) => [text, 'wrong-version']), ...INVALID_RECORD.map((text) => [text, 'invalid-record'])];
  for (const [text, reason] of cases) {
    await withStored(text, () => {
      let result;
      try {
        result = loadTasks(storage);
      } catch (error) {
        result = `it threw ${error.name}: ${error.message}`;
      }
      expect(result, `loadTasks for ${short(text)}`).toEqual({ ok: false, reason });
    });
  }
});

test('damaged data stays saved and is copied under the backup key', async () => {
  const { loadTasks } = await moduleWith(STORAGE, ['loadTasks']);
  const valid = saved(savedSample());
  for (const text of [valid, ...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    await withStored(text, () => {
      try {
        loadTasks(storage);
      } catch (error) {
        // The previous check reports a throwing loadTasks.
      }
      expect(storage.getItem(KEY), `the text under "${KEY}" after loading ${short(text)}`).toBe(text);
      if (text !== valid) expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after loading ${short(text)}`).toBe(text);
    });
  }
});

test('saveTasks saves the tasks with schemaVersion 1', async () => {
  const { saveTasks } = await moduleWith(STORAGE, ['saveTasks']);
  await withStored(null, () => {
    saveTasks(storage, savedSample());
    expect(savedValue(), `the JSON under "${KEY}" after saveTasks(storage, three tasks)`).toEqual({ schemaVersion: 1, records: savedSample() });
  });
});

test('damaged saved data shows the message and the starting tasks after a restart', async () => {
  for (const text of [UNPARSABLE[0], WRONG_VERSION[0], INVALID_RECORD[0]]) {
    expect(await restartWith(text), `an error while app.js ran again with ${short(text)} saved`).toBeNull();
    expect(inOrder(statusText(), L.loadErrorMessage), `"${L.loadErrorMessage}" in the role="status" element after a restart with ${short(text)} saved`).toBe(true);
    expect(cardIds(), `the data-id of the cards after a restart with ${short(text)} saved`).toEqual(fixtures().map((record) => record.id));
    expect(storage.getItem(BACKUP), `the text under "${BACKUP}" after that restart`).toBe(text);
  }
});

test('saved tasks come back after a restart, without the message', async () => {
  expect(await restartWith(saved(savedSample())), 'an error while app.js ran again with three valid tasks saved').toBeNull();
  expect(cardIds(), 'the data-id of the cards after a restart with t-02, t-7 and t-8 saved').toEqual(['t-02', 't-7', 't-8']);
  for (const parts of [[L.fixture2Name, '2026-03-01'], [L.doneMark]]) {
    expect(inOrder(card('t-02')?.textContent, ...parts), `the card t-02 shows ${parts.map((part) => `"${part}"`).join(', then ')}`).toBe(true);
  }
  expect(statusText().trim(), 'the text of the role="status" element after a restart with valid data').toBe('');
});

test('a task added after a restart gets an id no other task has', async () => {
  await addThroughForm(L.fixture1Name);
  const ids = savedValue()?.records?.map((record) => record.id) ?? [];
  expect(ids.length, 'the number of saved records after adding a task to t-02, t-7 and t-8').toBe(4);
  expect(new Set(ids).size, `different ids among the saved ids ${JSON.stringify(ids)}`).toBe(ids.length);
  expect(cards().length, 'the number of cards after that').toBe(4);
});

test('tasks stays the starting list', async () => {
  const domain = (await load(DOMAIN)).module ?? {};
  expect(domain.tasks, 'tasks of domain/tasks.js after all actions and restarts').toEqual(fixtures());
});
