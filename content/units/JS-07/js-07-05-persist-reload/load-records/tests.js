const KEY = 'jsll.planner.v1';
const BACKUP = 'jsll.planner.v1.backup';
const water = { id: 't-01', title: L.water, dueDate: '2026-03-02', done: false, priority: 'normal' };
const grandma = { id: 't-03', title: L.grandma, dueDate: null, done: false, priority: 'low' };
const saved = (records, version = 1) => JSON.stringify({ schemaVersion: version, records: records });

const UNPARSABLE = ['not json', saved([water]).slice(0, -1)];
const WRONG_VERSION = [
  saved([water], 2),
  saved([water], '1'),
  JSON.stringify({ records: [water] }),
  JSON.stringify({ schemaVersion: 1, records: 't-01' }),
  'null',
  JSON.stringify([water]),
];
const INVALID_RECORD = [
  saved([water, { ...grandma, dueDate: '01.03.2026' }]),
  saved([{ ...water, priority: 'urgent' }]),
  saved([water, { ...grandma, done: 'false' }]),
];

// Calls loadRecords with only `text` stored under the key (nothing when text is null) and then
// puts the exercise's own storage back exactly as it was, so a check never changes it.
function loadWith(text) {
  const before = {};
  for (let i = 0; i < storage.length; i += 1) before[storage.key(i)] = storage.getItem(storage.key(i));
  storage.clear();
  if (text !== null) storage.setItem(KEY, text);
  try {
    const loadRecords = scope.loadRecords;
    expect(typeof loadRecords, 'loadRecords as the checks see it (the file must run to its end)').toBe('function');
    const result = loadRecords(storage);
    return { result, stored: storage.getItem(KEY), backup: storage.getItem(BACKUP) };
  } finally {
    storage.clear();
    for (const [key, value] of Object.entries(before)) storage.setItem(key, value);
  }
}

test('the file runs to its end', () => {
  expect(loadError(), 'uncaught error while the file ran').toBeNull();
});

test('valid stored data gives ok and the records', () => {
  expect(loadWith(saved([water, grandma])).result, 'loadRecords for two valid tasks').toEqual({ ok: true, records: [water, grandma] });
  expect(loadWith(saved([])).result, 'loadRecords for an empty list').toEqual({ ok: true, records: [] });
});

test('nothing stored gives missing and no backup', () => {
  const { result, backup } = loadWith(null);
  expect(result, 'loadRecords when nothing is stored').toEqual({ ok: false, reason: 'missing' });
  expect(backup, 'the backup key when nothing is stored').toBeNull();
});

test('text that is not JSON gives unparsable', () => {
  for (const text of UNPARSABLE) {
    expect(loadWith(text).result, 'loadRecords for ' + JSON.stringify(text)).toEqual({ ok: false, reason: 'unparsable' });
  }
});

test('another shape or version gives wrong-version', () => {
  for (const text of WRONG_VERSION) {
    expect(loadWith(text).result, 'loadRecords for ' + text).toEqual({ ok: false, reason: 'wrong-version' });
  }
});

test('an invalid record gives invalid-record', () => {
  for (const text of INVALID_RECORD) {
    expect(loadWith(text).result, 'loadRecords for ' + text).toEqual({ ok: false, reason: 'invalid-record' });
  }
});

test('every failure keeps the stored text in the backup key', () => {
  for (const text of [...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    expect(loadWith(text).backup, 'the backup after loading ' + JSON.stringify(text)).toBe(text);
  }
});

test('loadRecords never changes the stored text', () => {
  for (const text of [saved([water]), ...UNPARSABLE, ...WRONG_VERSION, ...INVALID_RECORD]) {
    expect(loadWith(text).stored, 'the stored text after loading ' + JSON.stringify(text)).toBe(text);
  }
});
