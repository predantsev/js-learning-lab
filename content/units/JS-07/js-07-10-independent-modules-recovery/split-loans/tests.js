const KEY = 'jsll.loans.v1';
const BACKUP = 'jsll.loans.v1.backup';

// Modules are loaded inside the checks: a module that fails to load fails a check, not all of them.
const load = async (path) => {
  try {
    return { module: await import(path), error: null };
  } catch (error) {
    return { module: null, error };
  }
};

const sampleLoans = () => [
  { id: 'l-04', title: L.book4, dueDate: '2026-02-25', returned: false },
  { id: 'l-05', title: L.book1, dueDate: '2026-03-10', returned: false },
  { id: 'l-06', title: L.book2, dueDate: '2026-02-01', returned: true },
];
const fixtureTitles = () => [L.book1, L.book2, L.book3];
const saved = (records, version = 1) => JSON.stringify({ schemaVersion: version, records: records });

const UNPARSABLE = ['not json', saved(sampleLoans()).slice(0, -2)];
const WRONG_VERSION = [
  saved(sampleLoans(), 2),
  saved(sampleLoans(), '1'),
  JSON.stringify({ schemaVersion: 1, records: 'l-04' }),
  'null',
  JSON.stringify(sampleLoans()),
];
const INVALID_RECORD = [
  saved([...sampleLoans(), { id: 'l-07', title: '', dueDate: '2026-03-01', returned: false }]),
  saved([{ id: 'l-08', title: L.book4, dueDate: '2026-03-01', returned: 'no' }]),
];

// Runs `use()` with only `text` saved under the key (nothing when text is null), then puts
// the exercise's own storage back exactly as it was.
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

const storageModule = async () => {
  const { module, error } = await load('./storage/loans.js');
  expect(error ? error.name + ': ' + error.message : null, 'error while loading storage/loans.js').toBeNull();
  expect(typeof module.loadLoans, 'the named export loadLoans of storage/loans.js').toBe('function');
  return module;
};

const listTitles = () => screen.$$('#loans li').map((item) => item.textContent.split(' — ')[0]);
const statsLines = () => logs().filter((line) => line === '▶ stats.js');

test('the page opens without an error', () => {
  expect(loadError(), 'error while the page loaded').toBeNull();
});

test('statistics load only when the button is clicked', async () => {
  expect(statsLines(), 'lines printed by stats.js before any click').toEqual([]);
  const start = scopeOf('main.js').start;
  expect(typeof start, 'start in main.js').toBe('function');
  await withStored(null, async () => {
    start(storage);
    await user.click(screen.$('#stats-button'));
    await waitFor(() => screen.$('#stats').textContent === L.statsText + '50%').catch(() => {});
  });
  expect(screen.$('#stats'), 'the statistics paragraph after the click').toHaveTextContent(L.statsText + '50%');
});

test('stats.js runs once, even after another click', async () => {
  await user.click(screen.$('#stats-button'));
  await sleep(150);
  expect(statsLines(), 'lines printed by stats.js after two clicks').toEqual(['▶ stats.js']);
});

test('domain/loans.js exports validateLoan', async () => {
  const { module } = await load('./domain/loans.js');
  const good = sampleLoans()[0];
  expect(module?.validateLoan?.(good), 'validateLoan(a valid loan)').toEqual({ ok: true, value: good });
  expect(module?.validateLoan?.({ id: 'l-09', title: ' ', dueDate: '2026-03-01', returned: 'no' }), 'validateLoan(a loan without a title, returned as text)')
    .toEqual({ ok: false, errors: { title: 'required', returned: 'not-boolean' } });
});

test('domain/loans.js exports countOverdue', async () => {
  const { module } = await load('./domain/loans.js');
  expect(module?.countOverdue?.(sampleLoans(), '2026-03-02'), 'countOverdue(three loans, "2026-03-02")').toBe(1);
  expect(module?.countOverdue?.([], '2026-03-02'), 'countOverdue([], "2026-03-02")').toBe(0);
});

test('loadLoans reads valid saved loans', async () => {
  const { loadLoans } = await storageModule();
  await withStored(saved(sampleLoans()), () => {
    expect(loadLoans(storage), 'loadLoans for three valid loans').toEqual({ ok: true, loans: sampleLoans() });
  });
});

test('loadLoans reports missing data without a backup', async () => {
  const { loadLoans } = await storageModule();
  await withStored(null, () => {
    expect(loadLoans(storage), 'loadLoans when nothing is saved').toEqual({ ok: false, reason: 'missing' });
    expect(storage.getItem(BACKUP), 'the backup key when nothing is saved').toBeNull();
  });
});

test('loadLoans reports unparsable text', async () => {
  const { loadLoans } = await storageModule();
  for (const text of UNPARSABLE) {
    await withStored(text, () => {
      expect(loadLoans(storage), 'loadLoans for ' + JSON.stringify(text)).toEqual({ ok: false, reason: 'unparsable' });
    });
  }
});

test('loadLoans reports another version or shape', async () => {
  const { loadLoans } = await storageModule();
  for (const text of WRONG_VERSION) {
    await withStored(text, () => {
      expect(loadLoans(storage), 'loadLoans for ' + text).toEqual({ ok: false, reason: 'wrong-version' });
    });
  }
});

test('loadLoans reports an invalid loan', async () => {
  const { loadLoans } = await storageModule();
  for (const text of INVALID_RECORD) {
    await withStored(text, () => {
      expect(loadLoans(storage), 'loadLoans for ' + text).toEqual({ ok: false, reason: 'invalid-record' });
    });
  }
});

test('every failure keeps the saved text in the backup key', async () => {
  const { loadLoans } = await storageModule();
  for (const text of [...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    await withStored(text, () => {
      loadLoans(storage);
      expect(storage.getItem(BACKUP), 'the backup after loading ' + JSON.stringify(text)).toBe(text);
    });
  }
});

test('loadLoans never changes the saved text', async () => {
  const { loadLoans } = await storageModule();
  for (const text of [saved(sampleLoans()), ...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    await withStored(text, () => {
      loadLoans(storage);
      expect(storage.getItem(KEY), 'the saved text after loading ' + JSON.stringify(text)).toBe(text);
    });
  }
});

test('saveLoans saves the loans with schemaVersion 1', async () => {
  const module = await storageModule();
  expect(typeof module.saveLoans, 'the named export saveLoans of storage/loans.js').toBe('function');
  await withStored(null, () => {
    module.saveLoans(storage, sampleLoans());
    expect(JSON.parse(storage.getItem(KEY)), 'the saved value').toEqual({ schemaVersion: 1, records: sampleLoans() });
  });
});

test('render shows the message, the overdue count and the loans', async () => {
  const { module } = await load('./ui/render.js');
  expect(typeof module?.render, 'the named export render of ui/render.js').toBe('function');
  module.render(sampleLoans(), L.damaged, 1);
  expect(screen.$('#message'), 'the message paragraph').toHaveTextContent(L.damaged);
  expect(screen.$('#summary'), 'the summary paragraph').toHaveTextContent(L.overdueText + '1');
  expect(listTitles(), 'the titles in the list').toEqual([L.book4, L.book1, L.book2]);
});

test('main.js uses the modules instead of its own copies', async () => {
  const main = scopeOf('main.js');
  const domain = (await load('./domain/loans.js')).module ?? {};
  const store = (await load('./storage/loans.js')).module ?? {};
  const ui = (await load('./ui/render.js')).module ?? {};
  const expected = { validateLoan: domain.validateLoan, countOverdue: domain.countOverdue, loadLoans: store.loadLoans, saveLoans: store.saveLoans, render: ui.render };
  for (const [name, fromModule] of Object.entries(expected)) {
    expect(typeof fromModule, name + ' exported by its module').toBe('function');
    if (name in main) expect(main[name], name + ' as main.js sees it').toBe(fromModule);
  }
  expect(typeof main.overdueShare, 'overdueShare inside main.js (it must come from stats.js through import())').toBe('undefined');
});

test('damaged saved data shows the warning and the starting loans', async () => {
  const start = scopeOf('main.js').start;
  expect(typeof start, 'start in main.js').toBe('function');
  for (const text of ['not json', saved(sampleLoans(), 2), INVALID_RECORD[0]]) {
    await withStored(text, () => {
      start(storage);
      expect(screen.$('#message'), 'the message after loading ' + JSON.stringify(text)).toHaveTextContent(L.damaged);
      expect(listTitles(), 'the titles after loading ' + JSON.stringify(text)).toEqual(fixtureTitles());
    });
  }
});

test('a first start shows no warning', async () => {
  const start = scopeOf('main.js').start;
  expect(typeof start, 'start in main.js').toBe('function');
  await withStored(null, () => {
    start(storage);
    expect(screen.$('#message').textContent, 'the message on a first start').toBe('');
    expect(listTitles(), 'the titles on a first start').toEqual(fixtureTitles());
  });
});
