// Checks of the transfer note: every skill sorted once against the project card, the right reason for
// each skill that stays in its lab, a recorded prediction and the real result of each fresh check, and
// a paragraph per lab.
import { notes } from './notes.js';
import { runSqlCheck, runAuthCheck, runSsrCheck } from './fresh-checks.js';

const LABS = {
  sql: { applied: ['versioned-migrations'], stayed: { 'parameterized-queries': 'file-storage', 'joins-aggregates': 'file-storage', 'index-query-plan': 'file-storage' } },
  auth: { applied: ['secrets-from-config', 'size-time-limits'], stayed: { 'password-hashing': 'single-user', 'session-expiry': 'single-user', 'ownership-checks': 'single-user' } },
  ssr: { applied: ['server-render', 'html-safe-initial-data', 'hydration-from-page-data'], stayed: { 'server-components': 'no-rsc-setup' } },
};
const note = (lab) => notes?.[lab] ?? {};
const appliedOf = (lab) => (Array.isArray(note(lab).applied) ? note(lab).applied : []);
const stayedOf = (lab) => (Array.isArray(note(lab).stayed) ? note(lab).stayed : []);
const sorted = (list) => [...list].sort();

test('every skill of each lab is in exactly one list', () => {
  for (const [lab, expected] of Object.entries(LABS)) {
    const all = [...appliedOf(lab), ...stayedOf(lab).map((entry) => entry?.skill)];
    expect(sorted(all), `skills listed for ${lab} (applied + stayed)`).toEqual(sorted([...expected.applied, ...Object.keys(expected.stayed)]));
  }
});

test('skills the project card uses are applied', () => {
  for (const [lab, expected] of Object.entries(LABS)) {
    expect(sorted(appliedOf(lab)), `applied skills of ${lab}`).toEqual(sorted(expected.applied));
  }
});

test('each skill that stays names the card property that makes it unnecessary', () => {
  for (const [lab, expected] of Object.entries(LABS)) {
    for (const entry of stayedOf(lab)) {
      if (!(entry?.skill in expected.stayed)) continue; // a misplaced skill is the first two checks' job
      expect(entry.because, `reason why ${entry.skill} stays in the ${lab} lab`).toBe(expected.stayed[entry.skill]);
    }
    expect(stayedOf(lab).length > 0, `${lab} has at least one skill that stays`).toBe(true);
  }
});

test('each lab records the observed result of its fresh check', async () => {
  const real = { sql: runSqlCheck(), auth: await runAuthCheck(), ssr: runSsrCheck() };
  for (const lab of Object.keys(LABS)) {
    expect(note(lab).observed, `observed of ${lab}`).toEqual(real[lab]);
  }
});

test('each lab records a prediction of the same shape', () => {
  const shapeOf = (value) => (Array.isArray(value) ? `array of ${value.length} ${[...new Set(value.map((item) => typeof item))].join('/')}` : typeof value);
  const expected = { sql: 'array of 3 number', auth: 'array of 3 number', ssr: 'boolean' };
  for (const [lab, shape] of Object.entries(expected)) {
    expect(shapeOf(note(lab).predicted), `shape of predicted for ${lab}`).toBe(shape);
  }
});

test('each lab has its own paragraph of at least 80 characters', () => {
  const paragraphs = Object.keys(LABS).map((lab) => (typeof note(lab).paragraph === 'string' ? note(lab).paragraph.trim() : ''));
  paragraphs.forEach((text, i) => expect(text.length >= 80, `paragraph of ${Object.keys(LABS)[i]} has at least 80 characters (it has ${text.length})`).toBe(true));
  expect(new Set(paragraphs).size, 'different paragraphs').toBe(3);
});
