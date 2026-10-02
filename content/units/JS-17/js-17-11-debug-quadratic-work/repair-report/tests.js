import * as report from './report.js';
import { categoriesById, makeDays, makeHabit } from './data.js';

const fn = (name) => {
  expect(typeof report[name], `type of the ${name} export of report.js`).toBe('function');
  return report[name];
};
const thrown = (run) => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
};
// The slow but obviously correct rate, to compare against.
const expectedRate = (completions, days) => (days.length === 0 ? 0 : days.filter((day) => completions.includes(day)).length / days.length);
function counted(list) {
  const counter = { reads: 0 };
  const proxy = new Proxy(list, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) counter.reads += 1;
      return Reflect.get(target, key, receiver);
    },
  });
  return { proxy, counter };
}

test('completionRate gives the same rates as before', () => {
  const days = makeDays(30);
  for (const i of [1, 2, 3]) {
    const habit = makeHabit(i, days, 'c-sport');
    expect(fn('completionRate')(habit.completions, days), `completionRate for habit ${i} over 30 days`).toBe(expectedRate(habit.completions, days));
  }
  expect(fn('completionRate')(['2026-03-01'], []), 'completionRate over no days').toBe(0);
});

test('completionRate reads each completion only a few times', () => {
  const days = makeDays(1000);
  const habit = makeHabit(1, days, 'c-sport');
  const { proxy, counter } = counted(habit.completions);
  const rate = fn('completionRate')(proxy, days);
  expect(rate, 'completionRate over 1,000 days').toBe(expectedRate(habit.completions, days));
  expect(counter.reads, `reads of the ${habit.completions.length} completions over 1,000 days`).toBeLessThanOrEqual(3 * habit.completions.length);
});

test('categoryPath builds the path from the root', () => {
  expect(fn('categoryPath')('c-sport', categoriesById), 'categoryPath("c-sport")').toBe(`${L.health} › ${L.sport}`);
  expect(fn('categoryPath')('c-mind', categoriesById), 'categoryPath("c-mind")').toBe(L.mind);
});

test('a category that is its own parent stops with an Error naming it', () => {
  const path = fn('categoryPath');
  const error = thrown(() => path('c-imported', categoriesById));
  expect(error?.name, 'error name for c-imported, its own parent').toBe('Error');
  expect(String(error.message).includes('c-imported'), 'the message names c-imported').toBe(true);
});

test('a longer cycle is caught too', () => {
  const path = fn('categoryPath');
  const loop = new Map([
    ['c-a', { id: 'c-a', name: 'A', parentId: 'c-b' }],
    ['c-b', { id: 'c-b', name: 'B', parentId: 'c-a' }],
  ]);
  const error = thrown(() => path('c-a', loop));
  expect(error?.name, 'error name for the cycle c-a → c-b → c-a').toBe('Error');
});

test('mergeCompletions keeps every date once, sorted, without changing its inputs', () => {
  const local = ['2026-02-27', '2026-02-28', '2026-03-01'];
  const imported = ['2026-02-28', '2026-02-20'];
  expect(fn('mergeCompletions')(local, imported), 'mergeCompletions(local, imported)').toEqual(['2026-02-20', '2026-02-27', '2026-02-28', '2026-03-01']);
  expect([local, imported], 'the two inputs after the merge').toEqual([['2026-02-27', '2026-02-28', '2026-03-01'], ['2026-02-28', '2026-02-20']]);
});

test('the streak of merged completions counts the days in a row', () => {
  const completions = fn('mergeCompletions')(['2026-02-28', '2026-03-01'], ['2026-02-27', '2026-02-25']);
  const habit = { id: 'h-9', name: L.habit, categoryId: 'c-sport', completions };
  expect(fn('buildHabitReport')(habit, categoriesById, makeDays(7), '2026-03-01').streak, 'the streak after merging').toBe(3);
});

// ---- your tests in report.test.js, run against the original report and against a fixed one ----
const fill = (code) => code.replace(/%%([a-zA-Z0-9_]+)%%/g, (match, key) => L[key] ?? match);
const ORIGINAL = fill("// The habit report. Something here is slow on big data, something sometimes crashes,\n// and the streak is sometimes wrong. Find all three with measurements, not guesses.\n\n// The share of the given days on which the habit was completed.\nexport function completionRate(completions, days) {\n  if (days.length === 0) return 0;\n  const done = days.map((day) => completions.includes(day));\n  return done.filter(Boolean).length / days.length;\n}\n\n// \"Health \u203a Sport\": the names from the root category down to this one.\nexport function categoryPath(categoryId, categoriesById) {\n  const category = categoriesById.get(categoryId);\n  if (category.parentId === null) return category.name;\n  return categoryPath(category.parentId, categoriesById) + \" \u203a \" + category.name;\n}\n\n// The completions from this device and from an imported file: sorted ascending, every date once.\nexport function mergeCompletions(local, imported) {\n  const merged = [...local];\n  for (const day of imported) {\n    if (!merged.includes(day)) merged.push(day);\n  }\n  return merged;\n}\n\nconst DAY_MS = 24 * 60 * 60 * 1000;\nconst previousDay = (day) => new Date(Date.parse(day + \"T00:00:00Z\") - DAY_MS).toISOString().slice(0, 10);\n\n// Consecutive completed days that end on `today`. Relies on sorted completions.\nexport function currentStreak(completions, today) {\n  let streak = 0;\n  let expected = today;\n  for (let i = completions.length - 1; i >= 0 && completions[i] === expected; i--) {\n    streak = streak + 1;\n    expected = previousDay(expected);\n  }\n  return streak;\n}\n\nexport function buildHabitReport(habit, categoriesById, days, today) {\n  return {\n    name: habit.name,\n    category: categoryPath(habit.categoryId, categoriesById),\n    rate: completionRate(habit.completions, days),\n    streak: currentStreak(habit.completions, today),\n  };\n}\n");
const FIXED = fill("// The habit report: an indexed completion rate, a category path that stops on a cycle,\n// and a merge that keeps completions sorted and unique.\n\n// The share of the given days on which the habit was completed.\nexport function completionRate(completions, days) {\n  if (days.length === 0) return 0;\n  const completed = new Set(completions);\n  const done = days.map((day) => completed.has(day));\n  return done.filter(Boolean).length / days.length;\n}\n\n// \"Health \u203a Sport\": the names from the root category down to this one.\nexport function categoryPath(categoryId, categoriesById, seen = new Set()) {\n  if (seen.has(categoryId)) {\n    throw new Error(`%%cycle%% ${categoryId}`);\n  }\n  seen.add(categoryId);\n  const category = categoriesById.get(categoryId);\n  if (category.parentId === null) return category.name;\n  return categoryPath(category.parentId, categoriesById, seen) + \" \u203a \" + category.name;\n}\n\n// The completions from this device and from an imported file: sorted ascending, every date once.\nexport function mergeCompletions(local, imported) {\n  return [...new Set([...local, ...imported])].toSorted();\n}\n\nconst DAY_MS = 24 * 60 * 60 * 1000;\nconst previousDay = (day) => new Date(Date.parse(day + \"T00:00:00Z\") - DAY_MS).toISOString().slice(0, 10);\n\n// Consecutive completed days that end on `today`. Relies on sorted completions.\nexport function currentStreak(completions, today) {\n  let streak = 0;\n  let expected = today;\n  for (let i = completions.length - 1; i >= 0 && completions[i] === expected; i--) {\n    streak = streak + 1;\n    expected = previousDay(expected);\n  }\n  return streak;\n}\n\nexport function buildHabitReport(habit, categoriesById, days, today) {\n  return {\n    name: habit.name,\n    category: categoryPath(habit.categoryId, categoriesById),\n    rate: completionRate(habit.completions, days),\n    streak: currentStreak(habit.completions, today),\n  };\n}\n");
const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
async function runSuite(reportModule) {
  const source = files['report.test.js'];
  if (typeof source !== 'string') throw new Error('report.test.js is missing');
  const urls = { 'testing.js': moduleUrl(files['testing.js']), 'data.js': moduleUrl(files['data.js']), 'report.js': moduleUrl(reportModule) };
  const rewritten = source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));
  const hidden = { test: window.test, expect: window.expect };
  delete window.test;
  delete window.expect;
  try {
    await import(moduleUrl(rewritten));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false });
  } finally {
    Object.assign(window, hidden);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

test('your tests pass with a fixed report', async () => {
  const results = await runSuite(FIXED);
  expect(results.length, 'number of tests in report.test.js').toBeGreaterThan(1);
  expect(failing(results), 'your tests that fail with a fixed report').toEqual([]);
});

test('one of your tests fails on the original report', async () => {
  const results = await runSuite(ORIGINAL);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the original report.js').toBe(true);
});
