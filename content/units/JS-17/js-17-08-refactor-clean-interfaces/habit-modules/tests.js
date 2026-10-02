import * as page from './page.ts';
import * as visibleModule from './domain/visible.ts';
import * as summaryModule from './domain/summary.ts';
import * as renderModule from './ui/render.ts';
import { HABITS } from './fixtures.js';

const fn = (module, name, file) => {
  expect(typeof module[name], `type of the ${name} export of ${file}`).toBe('function');
  return module[name];
};
const visibleHabits = () => fn(visibleModule, 'visibleHabits', 'domain/visible.ts');
const summarizeHabits = () => fn(summaryModule, 'summarizeHabits', 'domain/summary.ts');
const renderSummary = () => fn(renderModule, 'renderSummary', 'ui/render.ts');
const texts = (root) => [...root.children].map((element) => element.textContent);
const ids = (habits) => habits.map((habit) => habit.id);

function shown(query) {
  page.view.query = query;
  try {
    const root = document.createElement('section');
    fn(page, 'showSummary', 'page.ts')(root, HABITS);
    return texts(root);
  } finally {
    page.view.query = '';
  }
}

test('the page shows exactly what it showed before the refactoring', () => {
  expect(shown(''), 'showSummary with an empty search').toEqual([`5 ${L.habits}`, `${L.doneToday} 4 · ${L.completions} 9`, [L.exercise, L.read, L.water, L.tidy, L.walk].join('')]);
  expect(shown(L.qCase), `showSummary with the search "${L.qCase}"`).toEqual([`1 ${L.habits}`, `${L.doneToday} 1 · ${L.completions} 3`, L.read]);
  expect(shown(L.qSpaces), `showSummary with the search "${L.qSpaces}"`).toEqual([`0 ${L.habits}`, `${L.doneToday} 0 · ${L.completions} 0`, '']);
});

test('visibleHabits keeps the active habits whose name contains the query, in any letter case', () => {
  expect(ids(visibleHabits()(HABITS, '')), 'visibleHabits(HABITS, "")').toEqual(['h-01', 'h-02', 'h-03', 'h-04', 'h-06']);
  expect(ids(visibleHabits()(HABITS, L.qCase)), `visibleHabits(HABITS, "${L.qCase}")`).toEqual(['h-02']);
  expect(ids(visibleHabits()(HABITS, L.qWords)), `visibleHabits(HABITS, "${L.qWords}") — a paused habit`).toEqual([]);
});

test('visibleHabits uses its query parameter, not view', () => {
  const run = visibleHabits();
  page.view.query = 'zzz';
  try {
    expect(ids(run(HABITS, '')), 'visibleHabits(HABITS, "") while view.query is "zzz"').toEqual(['h-01', 'h-02', 'h-03', 'h-04', 'h-06']);
  } finally {
    page.view.query = '';
  }
});

test('summarizeHabits counts the habits it receives for the given day', () => {
  const active = HABITS.filter((habit) => habit.active);
  expect(summarizeHabits()(active, '2026-03-01'), 'summarizeHabits(active habits, "2026-03-01")').toEqual({ count: 5, doneToday: 4, completions: 9 });
  expect(summarizeHabits()(active, '2026-02-28'), 'summarizeHabits(active habits, "2026-02-28")').toEqual({ count: 5, doneToday: 2, completions: 9 });
  expect(summarizeHabits()([], '2026-03-01'), 'summarizeHabits([], "2026-03-01")').toEqual({ count: 0, doneToday: 0, completions: 0 });
});

test('renderSummary draws the summary it is given', () => {
  const root = document.createElement('section');
  renderSummary()(root, { count: 42, doneToday: 7, completions: 99 }, [HABITS[0]]);
  expect(texts(root), 'what renderSummary draws for count 42, doneToday 7, completions 99').toEqual([`42 ${L.habits}`, `${L.doneToday} 7 · ${L.completions} 99`, L.exercise]);
});

test('the domain functions do not touch the page', () => {
  const run = { visible: visibleHabits(), summarize: summarizeHabits() };
  const original = document.createElement;
  let touched = 0;
  document.createElement = function (...args) {
    touched += 1;
    return original.apply(this, args);
  };
  try {
    run.summarize(run.visible(HABITS, ''), '2026-03-01');
  } finally {
    document.createElement = original;
  }
  expect(touched, 'elements created by visibleHabits and summarizeHabits').toBe(0);
});

test('your characterization tests in habits.test.js are still green', async () => {
  const { run } = await import('./testing.js');
  const results = await run({ print: false });
  expect(results.length, 'number of tests in habits.test.js').toBeGreaterThan(0);
  expect(results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`), 'characterization tests that fail').toEqual([]);
});
