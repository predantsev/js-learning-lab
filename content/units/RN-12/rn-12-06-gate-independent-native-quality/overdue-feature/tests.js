import { createElement, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Pressable, Text, View } from 'react-native';
import * as testing from './testing.js';
import { useImplementation } from './feature.js';
import { mockGaps } from './gaps.js';
import { overdueOn } from './overdue.js';
import { OverdueBadge } from './OverdueBadge.jsx';
import { tasks } from './tasks.js';

// ---------- the feature itself ----------

const byDue = (a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0);
const referenceRule = (list, day) => list.filter((task) => !task.done && task.dueDate !== null && task.dueDate < day).sort(byDue);

function show(element) {
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  flushSync(() => root.render(element));
  return {
    box,
    done() {
      flushSync(() => root.unmount());
      box.remove();
    },
  };
}

test('overdueOn returns the pending tasks due before the day, the oldest first', () => {
  expect(typeof overdueOn, 'type of overdueOn').toBe('function');
  const list = [
    { id: 'a', title: 'a', dueDate: '2026-03-01', done: false },
    { id: 'b', title: 'b', dueDate: '2026-03-05', done: false },
    { id: 'c', title: 'c', dueDate: null, done: false },
    { id: 'd', title: 'd', dueDate: '2026-02-20', done: true },
    { id: 'e', title: 'e', dueDate: '2026-02-25', done: false },
    { id: 'f', title: 'f', dueDate: '2026-03-04', done: false },
  ];
  expect(overdueOn(list, '2026-03-04').map((task) => task.id), 'ids of overdueOn(list, "2026-03-04")').toEqual(['e', 'a']);
  expect(overdueOn([], '2026-03-04'), 'overdueOn([], …)').toEqual([]);
});

test('overdueOn leaves the given list unchanged', () => {
  expect(typeof overdueOn, 'type of overdueOn').toBe('function');
  const list = [
    { id: 'x', title: 'x', dueDate: '2026-03-01', done: false },
    { id: 'y', title: 'y', dueDate: '2026-02-20', done: false },
    { id: 'z', title: 'z', dueDate: '2026-02-25', done: false },
  ];
  const before = JSON.stringify(list);
  overdueOn(list, '2026-03-02');
  expect(JSON.stringify(list), 'the list after overdueOn').toBe(before);
});

test('the badge shows nothing when no task is overdue', () => {
  const view = show(createElement(OverdueBadge, { tasks, day: '2026-02-01' }));
  try {
    expect(view.box.textContent, 'text of the badge on 2026-02-01').toBe('');
  } finally {
    view.done();
  }
});

test('the badge is a button named with the count, and pressing it lists the overdue titles', async () => {
  const view = show(createElement(OverdueBadge, { tasks, day: '2026-03-02' }));
  try {
    const button = [...view.box.querySelectorAll('[role="button"]')].find((el) => el.getAttribute('aria-label') === `${L.overdueLabel}: 2`);
    expect(Boolean(button), `a button with the accessibility label "${L.overdueLabel}: 2"`).toBe(true);
    expect(view.box.textContent.includes(L.t6), 'the titles are hidden before the press').toBe(false);
    await user.click(button);
    await settle();
    expect(view.box.textContent, 'text of the badge after the press').toContain(L.t6);
    expect(view.box.textContent, 'text of the badge after the press').toContain(L.t2);
  } finally {
    view.done();
  }
});

// ---------- your tests, against the correct feature and against broken versions ----------

function referenceBadge({ opens = true } = {}) {
  const h = createElement;
  return function ReferenceBadge({ tasks: list, day }) {
    const [open, setOpen] = useState(false);
    const overdue = referenceRule(list, day);
    if (overdue.length === 0) return null;
    return h(View, null,
      h(Pressable, { accessibilityRole: 'button', accessibilityLabel: `${L.overdueLabel}: ${overdue.length}`, onPress: () => setOpen((v) => !v) },
        h(Text, null, `${L.overdue}: ${overdue.length}`)),
      opens && open ? overdue.map((task) => h(Text, { key: task.id }, task.title)) : null);
  };
}

async function runSuite({ rule = referenceRule, badge = referenceBadge() } = {}) {
  useImplementation(rule);
  testing.restoreComponents();
  testing.replaceComponent(OverdueBadge, badge);
  const broken = rule !== referenceRule || badge.broken;
  testing.setDefaultTimeout(broken ? 600 : 2000);
  try {
    return await testing.run({ print: false, bail: broken });
  } finally {
    useImplementation();
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

let passesWithCorrectFeature = false;
async function expectCatches(broken) {
  expect(passesWithCorrectFeature, 'your tests pass with the correct feature (an earlier check)').toBe(true);
  const results = await runSuite(broken);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with this defect').toBe(true);
}

test('your tests pass with the correct feature', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in overdue.test.jsx').toBeGreaterThanOrEqual(3);
  expect(failing(results), 'your tests that fail with the correct feature').toEqual([]);
  passesWithCorrectFeature = true;
});

test('a test fails when a task due on the day itself counts as overdue', async () => {
  await expectCatches({ rule: (list, day) => list.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= day).sort(byDue) });
});

test('a test fails when done tasks count as overdue', async () => {
  await expectCatches({ rule: (list, day) => list.filter((task) => task.dueDate !== null && task.dueDate < day).sort(byDue) });
});

test('a test fails when pressing the badge lists nothing', async () => {
  const badge = referenceBadge({ opens: false });
  badge.broken = true;
  await expectCatches({ badge });
});

// ---------- the mock-gap list ----------

const MOCKED = ['clock', 'screen-reader', 'storage', 'app-state', 'notifications'];
const CHECKS = ['restart', 'offline', 'lifecycle', 'security', 'a11y', 'performance'];

test('every mock gap names what is mocked, what is not proved and a device check', () => {
  expect(Array.isArray(mockGaps) && mockGaps.length > 0, 'mockGaps has entries').toBe(true);
  for (const [index, entry] of mockGaps.entries()) {
    expect(MOCKED.includes(entry?.mocked), `mockGaps[${index}].mocked is one of the listed parts`).toBe(true);
    const gap = typeof entry?.gap === 'string' ? entry.gap.trim() : '';
    expect(gap.length >= 20, `mockGaps[${index}].gap has at least 20 characters`).toBe(true);
    expect(CHECKS.includes(entry?.deviceCheck), `mockGaps[${index}].deviceCheck is one of the device checks`).toBe(true);
  }
});

test('the mock gaps include the clock', () => {
  expect(Array.isArray(mockGaps) && mockGaps.some((entry) => entry?.mocked === 'clock'), "an entry with mocked: 'clock'").toBe(true);
});

test('the mock gaps include the screen reader, checked as accessibility', () => {
  const entry = Array.isArray(mockGaps) ? mockGaps.find((item) => item?.mocked === 'screen-reader') : undefined;
  expect(entry?.deviceCheck, "deviceCheck of the 'screen-reader' entry").toBe('a11y');
});
