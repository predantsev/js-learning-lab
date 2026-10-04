import { dryRun, migrate1to2 } from './app.js';

// Fresh data for every check (the demo driver must not share objects with the checks).
const v1 = () => ({
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: L.shopping, body: L.shoppingBody, pinned: true },
    { id: 'n-02', title: L.ideas, body: L.ideasBody, pinned: false },
    { id: 'n-04', title: L.empty, body: '', pinned: false },
  ],
});

const guard = () => {
  expect(typeof migrate1to2, 'type of migrate1to2').toBe('function');
  expect(typeof dryRun, 'type of dryRun').toBe('function');
};

function threw(run) {
  try {
    run();
    return false;
  } catch {
    return true;
  }
}

test('a v1 store becomes v2 with the tags of each body', () => {
  guard();
  const after = migrate1to2(v1());
  expect(after.schemaVersion, 'schemaVersion after the migration').toBe(2);
  expect(after.records.map((note) => note.tags), 'tags of the three notes').toEqual([L.shoppingTags.split(','), L.ideasTags.split(','), []]);
  expect(after.records[0], 'the first note after the migration').toMatchObject({ id: 'n-01', title: L.shopping, body: L.shoppingBody, pinned: true });
});

test('a v2 store comes back unchanged', () => {
  guard();
  const v2 = { schemaVersion: 2, records: [{ id: 'n-05', title: L.ideas, body: L.ideasBody, pinned: false, tags: ['mine'] }] };
  const expected = JSON.stringify(v2);
  expect(JSON.stringify(migrate1to2(v2)), 'migrate1to2 of a version 2 store whose tags a person edited').toBe(expected);
});

test('migrate1to2 does not change the store it is given', () => {
  guard();
  const store = v1();
  const before = JSON.stringify(store);
  migrate1to2(store);
  expect(JSON.stringify(store), 'the given store after migrate1to2').toBe(before);
});

test('a body that is not text makes migrate1to2 throw', () => {
  guard();
  const store = v1();
  store.records.push({ id: 'n-03', title: L.ideas, body: null, pinned: false });
  expect(threw(() => migrate1to2(store)), 'migrate1to2 throws for a note whose body is null').toBe(true);
});

test('dryRun passes a good store and reports its count', () => {
  guard();
  expect(dryRun(v1()), 'dryRun of a good version 1 store').toEqual({ ok: true, count: 3 });
});

test('dryRun reports a migration that throws instead of throwing itself', () => {
  guard();
  const failing = () => {
    throw new Error('n-02: cannot migrate');
  };
  let report;
  expect(threw(() => { report = dryRun(v1(), failing); }), 'dryRun throws when the migration throws').toBe(false);
  expect(report?.ok, 'report.ok').toBe(false);
  expect(typeof report?.problem, 'type of report.problem').toBe('string');
});

test('dryRun catches a migration that loses a record', () => {
  guard();
  const losing = (store) => ({ schemaVersion: 2, records: store.records.filter((note) => note.body !== '').map((note) => ({ ...note, tags: note.tags ?? [] })) });
  expect(dryRun(v1(), losing)?.ok, 'report.ok for a migration that drops the note with an empty body').toBe(false);
});

test('dryRun catches a migration that is not safe to rerun', () => {
  guard();
  const growing = (store) => ({ schemaVersion: 2, records: store.records.map((note) => ({ ...note, tags: [...(note.tags ?? []), 'x'] })) });
  expect(dryRun(v1(), growing)?.ok, 'report.ok for a migration that adds a tag on every run').toBe(false);
});

test('dryRun leaves the store it checks unchanged', () => {
  guard();
  const inPlace = (store) => {
    for (const note of store.records) note.tags = [];
    store.schemaVersion = 2;
    return store;
  };
  const store = v1();
  const before = JSON.stringify(store);
  dryRun(store, inPlace);
  expect(JSON.stringify(store), 'the store after dryRun with a migration that edits its input').toBe(before);
});
