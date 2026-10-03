import { restoreSnapshot } from './restore.ts';

const habit = (id, name, extra = {}) => ({ id, name, frequency: 'daily', active: true, completions: [], ...extra });
const text = (schemaVersion, records) => JSON.stringify({ schemaVersion, records });
const fn = () => expect(typeof restoreSnapshot, 'type of restoreSnapshot').toBe('function');
const safely = (raw) => {
  try {
    return restoreSnapshot(raw);
  } catch (error) {
    return `threw ${error?.name}: ${error?.message}`;
  }
};

test('nothing saved gives an empty list', () => {
  fn();
  expect(safely(null), 'restoreSnapshot(null)').toEqual({ ok: true, records: [] });
});

test('a current snapshot gives the validated habits', () => {
  fn();
  const raw = text(1, [
    habit('h-01', `  ${L.exercise}  `, { completions: ['2026-02-27', '2026-02-28'] }),
    habit('h-04', L.tidy, { frequency: 'weekly' }),
  ]);
  expect(safely(raw), 'restoreSnapshot of a v1 snapshot').toEqual({
    ok: true,
    records: [habit('h-01', L.exercise, { completions: ['2026-02-27', '2026-02-28'] }), habit('h-04', L.tidy, { frequency: 'weekly' })],
  });
});

test('a v0 snapshot is migrated before it is validated', () => {
  fn();
  const raw = text(0, [{ id: 'h-03', name: L.water, active: true, completions: ['2026-03-01'] }]);
  expect(safely(raw), 'restoreSnapshot of a v0 snapshot').toEqual({ ok: true, records: [habit('h-03', L.water, { completions: ['2026-03-01'] })] });
});

test('damaged text is reported as unparsable instead of throwing', () => {
  fn();
  for (const raw of ['{"schemaVersion":1,"records":[{"id":"h-0', 'not json', '']) {
    expect(safely(raw), `restoreSnapshot(${JSON.stringify(raw)})`).toEqual({ ok: false, reason: 'unparsable' });
  }
});

test('a newer or unknown snapshot is reported with the migration reason', () => {
  fn();
  expect(safely(text(2, [habit('h-01', L.exercise)])), 'restoreSnapshot of a v2 snapshot').toEqual({ ok: false, reason: 'newer' });
  expect(safely(JSON.stringify({ schemaVersion: 1, habits: [] })), 'restoreSnapshot without records').toEqual({ ok: false, reason: 'invalid' });
  expect(safely('42'), 'restoreSnapshot("42")').toEqual({ ok: false, reason: 'invalid' });
});

test('one invalid habit rejects the whole snapshot and names it', () => {
  fn();
  const raw = text(1, [habit('h-01', L.exercise), habit('h-02', '   '), habit('h-03', L.water)]);
  expect(safely(raw), 'restoreSnapshot with an empty name in the second habit').toEqual({
    ok: false,
    reason: 'invalid-record',
    index: 1,
    errors: { name: 'required' },
  });
});

test('a habit with broken completions is not let through', () => {
  fn();
  const raw = text(1, [habit('h-05', L.words, { completions: '2026-02-20' })]);
  expect(safely(raw), 'restoreSnapshot with completions as text').toEqual({
    ok: false,
    reason: 'invalid-record',
    index: 0,
    errors: { completions: 'invalid' },
  });
});
