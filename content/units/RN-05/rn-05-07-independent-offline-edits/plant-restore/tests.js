import { MAX_SNAPSHOT_LENGTH, migrate, prepareSave, restoreSnapshot } from './snapshot.ts';

const plant = (id, name, everyDays, lastWatered) => ({ id, name, everyDays, lastWatered });
const text = (schemaVersion, records) => JSON.stringify({ schemaVersion, records });
const fns = () => {
  expect(typeof migrate, 'type of migrate').toBe('function');
  expect(typeof restoreSnapshot, 'type of restoreSnapshot').toBe('function');
  expect(typeof prepareSave, 'type of prepareSave').toBe('function');
};
const safely = (call) => {
  try {
    return call();
  } catch (error) {
    return `threw ${error?.name}: ${error?.message}`;
  }
};

test('nothing stored restores an empty list', () => {
  fns();
  expect(safely(() => restoreSnapshot(null)), 'restoreSnapshot(null)').toEqual({ ok: true, records: [] });
});

test('a current snapshot restores its validated plants', () => {
  fns();
  const raw = text(1, [plant('p-04', ` ${L.monstera} `, 7, '2026-02-26'), plant('p-05', L.aloe, 21, null)]);
  expect(safely(() => restoreSnapshot(raw)), 'restoreSnapshot of a v1 snapshot').toEqual({
    ok: true,
    records: [plant('p-04', L.monstera, 7, '2026-02-26'), plant('p-05', L.aloe, 21, null)],
  });
});

test('an outdated v0 snapshot is migrated to numbers and null dates', () => {
  fns();
  const raw = text(0, [plant('p-06', L.ficus, '10', '2026-02-20'), plant('p-07', L.mint, '2', '')]);
  expect(safely(() => restoreSnapshot(raw)), 'restoreSnapshot of a v0 snapshot').toEqual({
    ok: true,
    records: [plant('p-06', L.ficus, 10, '2026-02-20'), plant('p-07', L.mint, 2, null)],
  });
});

test('migrate keeps a current snapshot and its input unchanged', () => {
  fns();
  const current = { schemaVersion: 1, records: [plant('p-04', L.monstera, 7, null)] };
  expect(safely(() => migrate(current)), 'migrate of a v1 snapshot').toEqual({ ok: true, snapshot: current });
  const old = { schemaVersion: 0, records: [plant('p-07', L.mint, '2', '')] };
  safely(() => migrate(old));
  expect(old, 'the v0 snapshot after migrate').toEqual({ schemaVersion: 0, records: [plant('p-07', L.mint, '2', '')] });
});

test('corrupt text is unparsable, never thrown and never replaced by made-up plants', () => {
  fns();
  for (const raw of [`{"schemaVersion":1,"records":[{"id":"p-0`, 'undefined', '']) {
    expect(safely(() => restoreSnapshot(raw)), `restoreSnapshot(${JSON.stringify(raw)})`).toEqual({ ok: false, reason: 'unparsable' });
  }
});

test('a snapshot from a newer app version is reported as newer', () => {
  fns();
  const raw = text(3, [{ ...plant('p-04', L.monstera, 7, null), light: 'shade' }]);
  expect(safely(() => restoreSnapshot(raw)), 'restoreSnapshot of a v3 snapshot').toEqual({ ok: false, reason: 'newer' });
});

test('an unknown shape is invalid', () => {
  fns();
  for (const raw of [JSON.stringify({ plants: [] }), JSON.stringify({ schemaVersion: 1, records: 'p-01' }), 'null', '[]']) {
    expect(safely(() => restoreSnapshot(raw)), `restoreSnapshot(${raw})`).toEqual({ ok: false, reason: 'invalid' });
  }
});

test('an old interval that is not a number rejects the snapshot instead of inventing one', () => {
  fns();
  const raw = text(0, [plant('p-06', L.ficus, '10', ''), plant('p-08', L.orchid, 'often', '')]);
  expect(safely(() => restoreSnapshot(raw)), 'restoreSnapshot of a v0 snapshot with everyDays "often"').toEqual({
    ok: false,
    reason: 'invalid-record',
    index: 1,
    errors: { everyDays: 'invalid' },
  });
});

test('one invalid plant rejects the whole snapshot', () => {
  fns();
  const raw = text(1, [plant('p-04', L.monstera, 7, null), plant('p-05', L.aloe, 21, '01.03.2026')]);
  expect(safely(() => restoreSnapshot(raw)), 'restoreSnapshot with a wrong date in the second plant').toEqual({
    ok: false,
    reason: 'invalid-record',
    index: 1,
    errors: { lastWatered: 'invalid' },
  });
});

test('prepareSave gives the JSON text of the current snapshot', () => {
  fns();
  const records = [plant('p-04', L.monstera, 7, null), plant('p-05', L.aloe, 21, '2026-03-01')];
  const result = safely(() => prepareSave(records));
  expect(result?.ok, 'prepareSave(...).ok').toBe(true);
  expect(JSON.parse(result.text), 'the text prepareSave returned, parsed').toEqual({ schemaVersion: 1, records });
});

test('an oversized list is refused whole, never cut to fit', () => {
  fns();
  const many = Array.from({ length: 80 }, (_, i) => plant(`p-${100 + i}`, `${L.fern} ${i}`, 3, '2026-03-01'));
  const length = JSON.stringify({ schemaVersion: 1, records: many }).length;
  expect(length > MAX_SNAPSHOT_LENGTH, 'the test list is longer than the limit').toBe(true);
  expect(safely(() => prepareSave(many)), 'prepareSave of 80 plants').toEqual({ ok: false, reason: 'too-large', length });
});
