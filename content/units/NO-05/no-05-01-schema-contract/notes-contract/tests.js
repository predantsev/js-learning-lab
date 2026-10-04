import { parseStore, storeContract } from './app.js';

const store = (records, schemaVersion = 1) => JSON.stringify({ schemaVersion, records });
const full = (id, title) => ({ id, title, body: L.body, pinned: false });

const guard = () => expect(typeof parseStore, 'type of parseStore').toBe('function');

// Runs parseStore and returns the problems it reported; fails when it did not throw with a problems array.
function problemsOf(json) {
  let caught;
  try {
    parseStore(json);
  } catch (error) {
    caught = error;
  }
  expect(caught !== undefined, 'parseStore throws for this store').toBe(true);
  expect(Array.isArray(caught.problems), `error.problems is an array (the error was: ${caught.message})`).toBe(true);
  return caught.problems;
}

const mentions = (problems, text) => problems.some((problem) => String(problem).includes(text));

test('a valid store loads with every record', () => {
  guard();
  const records = [full('n-01', L.shopping), full('n-02', L.ideas)];
  expect(parseStore(store(records)), 'parseStore of a valid store').toEqual({ schemaVersion: 1, records });
});

test('missing body and pinned get their defaults', () => {
  guard();
  const result = parseStore(store([{ id: 'n-03', title: L.ideas }]));
  expect(result.records, 'records after loading { id, title }').toEqual([{ id: 'n-03', title: L.ideas, body: '', pinned: false }]);
});

test('a title stored as a number is rejected', () => {
  guard();
  const problems = problemsOf(store([full('n-01', L.shopping), { ...full('n-02', L.ideas), title: 42 }]));
  expect(mentions(problems, 'records[1].title'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('a record without a title is rejected', () => {
  guard();
  const problems = problemsOf(store([{ id: 'n-01', body: L.body }]));
  expect(mentions(problems, 'records[0].title'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('an unknown field is rejected', () => {
  guard();
  const problems = problemsOf(store([{ ...full('n-01', L.shopping), colour: 'yellow' }]));
  expect(mentions(problems, 'records[0].colour'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('a repeated id is rejected', () => {
  guard();
  const problems = problemsOf(store([full('n-01', L.shopping), full('n-01', L.ideas)]));
  expect(mentions(problems, 'records[1].id'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('a store with another schemaVersion is rejected', () => {
  guard();
  const problems = problemsOf(store([full('n-01', L.shopping)], 2));
  expect(mentions(problems, 'schemaVersion'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('a store whose records is not an array is rejected', () => {
  guard();
  const problems = problemsOf(JSON.stringify({ schemaVersion: 1, records: { 'n-01': full('n-01', L.shopping) } }));
  expect(mentions(problems, 'records'), `problems: ${JSON.stringify(problems)}`).toBe(true);
});

test('every problem is reported at once', () => {
  guard();
  const problems = problemsOf(store([{ ...full('n-01', L.shopping), pinned: 'yes' }, { id: 'n-02', body: '' }], 0));
  for (const text of ['schemaVersion', 'records[0].pinned', 'records[1].title']) {
    expect(mentions(problems, text), `a problem naming ${text} among ${JSON.stringify(problems)}`).toBe(true);
  }
});

test('storeContract has version 1 and rules for id, title, body and pinned', () => {
  expect(storeContract?.version, 'storeContract.version').toBe(1);
  expect(Object.keys(storeContract?.fields ?? {}).sort(), 'the fields of storeContract').toEqual(['body', 'id', 'pinned', 'title']);
});
