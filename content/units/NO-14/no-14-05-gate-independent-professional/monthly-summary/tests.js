// Checks of the monthly summary: the SQL over a real ledger file, the validated API route with its
// limits, the server-rendered page with safe data, the safe 500 and the request log, a restart, your
// tests run against your summary.js and two broken ones (written here), and the lab note.
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.js';
import { freshLedger } from './expenses-db.js';
import { createElement as h, renderToString } from './mini-react.js';
import { MonthSummary } from './MonthSummary.js';
import { labs } from './notes.js';
import { monthSummary } from './summary.js';

// The checks' own ledger: other amounts than the fixtures, a label that tries to close a script.
const LEDGER = [
  { id: 'x-01', label: 'before', amountMinor: 700, date: '2026-05-31', category: 'fun' },
  { id: 'x-02', label: 'first day', amountMinor: 1200, date: '2026-06-01', category: 'food' },
  { id: 'x-03', label: 'rent & </script><b>', amountMinor: 50000, date: '2026-06-02', category: 'home' },
  { id: 'x-04', label: 'small lamp', amountMinor: 900, date: '2026-06-15', category: 'home' },
  { id: 'x-05', label: 'last day', amountMinor: 1800, date: '2026-06-30', category: 'food' },
  { id: 'x-06', label: 'bus', amountMinor: 300, date: '2026-06-30', category: 'transport' },
  { id: 'x-07', label: 'after', amountMinor: 4000, date: '2026-07-01', category: 'food' },
];
const JUNE = {
  month: '2026-06',
  total: 54200,
  categories: [
    { category: 'home', total: 50900, count: 2, largest: 'rent & </script><b>' },
    { category: 'food', total: 3000, count: 2, largest: 'last day' },
    { category: 'transport', total: 300, count: 1, largest: 'bus' },
  ],
};
const open = (name) => new DatabaseSync(freshLedger(tmp(name), LEDGER));
async function serve(name) {
  const db = open(name);
  const entries = [];
  const base = await listen(createApp({ db, log: (entry) => entries.push(entry) }));
  return { db, base, entries };
}

test('monthSummary totals one month by category, most spent first, with the largest expense', () => {
  const db = open('check-sql');
  try {
    expect(monthSummary(db, '2026-06', 5), 'June').toEqual(JUNE);
  } finally { db.close(); }
});

test('the first and the last day count, the days around the month do not', () => {
  const db = open('check-edges');
  try {
    expect(monthSummary(db, '2026-05', 5).total, 'total of May (only 31 May)').toBe(700);
    expect(monthSummary(db, '2026-07', 5).total, 'total of July (only 1 July)').toBe(4000);
    expect(monthSummary(db, '2026-12', 5), 'December').toEqual({ month: '2026-12', total: 0, categories: [] });
  } finally { db.close(); }
});

test('top limits the categories, the total keeps every category', () => {
  const db = open('check-top');
  try {
    const top1 = monthSummary(db, '2026-06', 1);
    expect(top1.categories.map((row) => row.category), 'categories with top 1').toEqual(['home']);
    expect(top1.total, 'total with top 1').toBe(54200);
  } finally { db.close(); }
});

// Ties: equal amounts inside a category, equal totals across categories. Inserted so that neither
// the insertion order nor the reverse order gives the right answer by luck.
const TIES = [
  { id: 't-02', label: 'second id', amountMinor: 500, date: '2026-08-10', category: 'food' },
  { id: 't-01', label: 'first id', amountMinor: 500, date: '2026-08-11', category: 'food' },
  { id: 't-04', label: 'lamp', amountMinor: 1000, date: '2026-08-13', category: 'home' },
  { id: 't-03', label: 'cinema', amountMinor: 1000, date: '2026-08-12', category: 'fun' },
];
test('ties: the smaller id is the largest expense, equal totals go by category name', () => {
  const db = new DatabaseSync(freshLedger(tmp('check-ties'), TIES));
  try {
    const august = monthSummary(db, '2026-08', 5);
    expect(august.categories.map((row) => row.category), 'order of three categories with equal totals').toEqual(['food', 'fun', 'home']);
    expect(august.categories[0]?.largest, 'largest of two food expenses of 500 (t-01 and t-02)').toBe('first id');
  } finally { db.close(); }
});

test('the month is only data in the SQL', () => {
  const db = open('check-injection');
  try {
    let result;
    try { result = monthSummary(db, "1999-01' OR date > '0", 5); } catch { result = { total: 0 }; }
    expect(result.total, 'total for a month that tries to rewrite the query').toBe(0);
  } finally { db.close(); }
});

test('GET /api/summary answers 200 with the JSON summary', async () => {
  const { db, base } = await serve('check-api');
  try {
    const answer = await request(`${base}/api/summary?month=2026-06&top=2`);
    expect(answer.status, 'status').toBe(200);
    expect(String(answer.headers['content-type']).startsWith('application/json'), 'content-type is JSON').toBe(true);
    expect(answer.json, 'body').toEqual({ ...JUNE, categories: JUNE.categories.slice(0, 2) });
  } finally { db.close(); }
});

test('GET /api/summary refuses a wrong month, top or parameter with 400 VALIDATION_FAILED', async () => {
  const { db, base } = await serve('check-validation');
  try {
    const queries = ['month=2026-6', 'month=2026-13', 'month=1999-12', 'month=2026-06&top=0', 'month=2026-06&top=11', 'month=2026-06&top=2.5', 'month=2026-06&sort=name', ''];
    const answers = [];
    for (const query of queries) answers.push(await request(`${base}/api/summary?${query}`));
    expect(answers.map((a) => a.status), `statuses for ${queries.map((q) => q || '(no month)').join(' · ')}`).toEqual(queries.map(() => 400));
    expect(answers.map((a) => a.json?.error?.code), 'error codes').toEqual(queries.map(() => 'VALIDATION_FAILED'));
  } finally { db.close(); }
});

test('the server limits how long a request may take to arrive: at most 5 s', () => {
  const server = createApp({ db: null });
  for (const name of ['requestTimeout', 'headersTimeout']) {
    expect(server[name] >= 1 && server[name] <= 5000, `${name} (${server[name]}) is from 1 to 5000 ms`).toBe(true);
  }
});

test('GET /summary/:month renders the summary on the server with safe initial data', async () => {
  const { db, base } = await serve('check-page');
  try {
    const answer = await request(`${base}/summary/2026-06`);
    expect(answer.status, 'status').toBe(200);
    expect(String(answer.headers['content-type']).startsWith('text/html'), 'content-type is HTML').toBe(true);
    const root = /<div id="root">([\s\S]*?)<\/div><script/.exec(answer.text)?.[1];
    expect(root, '#root followed by a script').toBe(renderToString(h(MonthSummary, { summary: JUNE })));
    const json = /<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/.exec(answer.text)?.[1] ?? '';
    expect(/[<>&\u2028\u2029]/.test(json), 'raw <, >, &, U+2028 or U+2029 in #initial-data').toBe(false);
    expect(JSON.parse(json || 'null'), 'parsed #initial-data').toEqual({ summary: JUNE });
    expect((await request(`${base}/summary/2026-6`)).status, 'status of /summary/2026-6').toBe(400);
  } finally { db.close(); }
});

test('a failing summary answers a safe 500 with the request id and logs it', async () => {
  const { db, base, entries } = await serve('check-500');
  db.close(); // every query now throws
  const answer = await request(`${base}/summary/2026-06`, { headers: { 'x-request-id': 'req-gate-5' } });
  expect(answer.status, 'status').toBe(500);
  expect(answer.text.includes('req-gate-5'), 'the request id is on the page').toBe(true);
  // Error details: the message of the closed database, an error class name, or a stack frame.
  expect(/database|not open|\b[A-Z]\w+Error\b|\bat \S+ \(|\bat (?:file|node):/.test(answer.text), 'error details on the page').toBe(false);
  expect(entries.some((e) => e.requestId === 'req-gate-5' && e.status === 500), 'a log entry with requestId req-gate-5 and status 500').toBe(true);
  const evil = await request(`${base}/summary/2026-06`, { headers: { 'x-request-id': '<img src=x onerror=alert(5)>' } });
  expect(evil.text.includes('<img'), 'markup from x-request-id on the page').toBe(false);
});

test('every request is logged once with its request id, method, path and status', async () => {
  const { db, base, entries } = await serve('check-log');
  try {
    await request(`${base}/api/summary?month=2026-06`, { headers: { 'x-request-id': 'req-a' } });
    await request(`${base}/api/summary?month=2026-99`, { headers: { 'x-request-id': 'req-b' } });
    await request(`${base}/nowhere`, { headers: { 'x-request-id': 'req-c' } });
    const seen = entries.map((e) => `${e.requestId} ${e.method} ${e.path} ${e.status}`);
    expect(seen, 'log entries').toEqual(['req-a GET /api/summary 200', 'req-b GET /api/summary 400', 'req-c GET /nowhere 404']);
  } finally { db.close(); }
});

test('after a restart over the same file the summary includes a new expense', async () => {
  const file = freshLedger(tmp('check-restart'), LEDGER);
  const first = new DatabaseSync(file);
  first.prepare('INSERT INTO expenses (id, label, amountMinor, date, category) VALUES (?, ?, ?, ?, ?)').run('x-08', 'film', 1100, '2026-06-20', 'fun');
  first.close();
  const db = new DatabaseSync(file);
  try {
    const answer = await request(`${await listen(createApp({ db }))}/api/summary?month=2026-06&top=10`);
    expect(answer.json?.total, 'total of June after the restart').toBe(55300);
  } finally { db.close(); }
});

// Two broken summary.js versions your tests must catch.
const BROKEN = {
  'counts-next-first-day': `export function monthSummary(db, month, top = 5) {
  const [y, m] = month.split('-').map(Number);
  const to = m === 12 ? (y + 1) + '-01-01' : y + '-' + String(m + 1).padStart(2, '0') + '-01';
  const rows = db.prepare("SELECT category, SUM(amountMinor) AS total, COUNT(*) AS count, (SELECT label FROM expenses AS l WHERE l.category = e.category AND l.date >= ? AND l.date <= ? ORDER BY l.amountMinor DESC, l.id LIMIT 1) AS largest FROM expenses AS e WHERE date >= ? AND date <= ? GROUP BY category ORDER BY total DESC, category").all(month + '-01', to, month + '-01', to);
  const categories = rows.map((r) => ({ category: r.category, total: r.total, count: r.count, largest: r.largest }));
  return { month, total: categories.reduce((s, r) => s + r.total, 0), categories: categories.slice(0, top) };
}`,
  'total-of-top-only': `export function monthSummary(db, month, top = 5) {
  const rows = db.prepare("SELECT category, SUM(amountMinor) AS total, COUNT(*) AS count, (SELECT label FROM expenses AS l WHERE l.category = e.category AND substr(l.date, 1, 7) = ? ORDER BY l.amountMinor DESC, l.id LIMIT 1) AS largest FROM expenses AS e WHERE substr(date, 1, 7) = ? GROUP BY category ORDER BY total DESC, category LIMIT ?").all(month, month, top);
  const categories = rows.map((r) => ({ category: r.category, total: r.total, count: r.count, largest: r.largest }));
  return { month, total: categories.reduce((s, r) => s + r.total, 0), categories };
}`,
};

async function runYourTests(folder, writeSummary) {
  const dir = tmp(folder);
  await mkdir(dir, { recursive: true });
  for (const name of ['summary.test.js', 'testing.js', 'expenses-db.js']) await copyFile(name, join(dir, name));
  await writeSummary(join(dir, 'summary.js'));
  const runner = await import(pathToFileURL(join(dir, 'testing.js')).href);
  await import(pathToFileURL(join(dir, 'summary.test.js')).href);
  return runner.run({ print: false });
}

test('your tests pass on your summary.js', async () => {
  const results = await runYourTests('yours', (to) => copyFile('summary.js', to));
  expect(results.length > 0, 'summary.test.js registers at least one test').toBe(true);
  expect(results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.message}`), 'your tests that fail on your summary.js').toEqual([]);
});

test('your tests fail on the first broken summary', async () => {
  const results = await runYourTests('broken-edge', (to) => writeFile(to, BROKEN['counts-next-first-day']));
  expect(results.some((r) => !r.passed), 'at least one of your tests fails on it').toBe(true);
});

test('your tests fail on the second broken summary', async () => {
  const results = await runYourTests('broken-total', (to) => writeFile(to, BROKEN['total-of-top-only']));
  expect(results.some((r) => !r.passed), 'at least one of your tests fails on it').toBe(true);
});

// A no-hint gate: the messages say whether the note is right, never which labs belong where.
test('the lab note names the labs the feature applies and explains each other one', () => {
  const used = Array.isArray(labs?.used) ? [...labs.used].sort() : [];
  expect(used.join() === 'sql,ssr', 'labs.used holds exactly the labs this feature applies').toBe(true);
  const notUsed = Array.isArray(labs?.notUsed) ? labs.notUsed : [];
  const others = ['auth', 'sql', 'ssr'].filter((lab) => !used.includes(lab));
  for (const lab of others) {
    const entry = notUsed.find((item) => item?.lab === lab);
    expect(typeof entry?.why === 'string' && entry.why.trim().length >= 60, `labs.notUsed explains ${lab} in at least 60 characters`).toBe(true);
  }
});
