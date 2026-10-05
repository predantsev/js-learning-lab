import { createElement, StrictMode, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as testing from './testing.js';
import HabitFeed from './HabitFeed';
import { publish, subscribe, subscriberCount } from './feed.js';

// Every check mounts its own copy of HabitFeed inside <StrictMode>, as main.jsx does, whatever
// main.jsx contains. Completions get ids that the learner's own tests never use.
let nextId = 100;
const completion = (habit, date) => ({ id: `c-${nextId++}`, habit, date });
// Mounting (flushSync) and root.unmount() are synchronous, so effects and cleanups have run when
// they return; a completion is published inside flushSync too, so its rows are on the page right
// after it. No check depends on how long a timer takes: tick() only lets queued work settle.
const publishNow = (record) => flushSync(() => publish(record));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountFeed() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(createElement(StrictMode, null, createElement(HabitFeed))));
  let mounted = true;
  return {
    rows: () => [...host.querySelectorAll('li')].map((row) => row.textContent.replace(/\s+/g, ' ').trim()),
    unmount: () => { if (mounted) { mounted = false; root.unmount(); } },
    remove() { this.unmount(); host.remove(); },
  };
}

test('one published completion shows exactly one row under StrictMode', async () => {
  const feed = mountFeed();
  try {
    await tick();
    publishNow(completion(L.exercise, '2026-03-01'));
    await tick();
    expect(feed.rows(), 'rows after one completion').toEqual([`${L.exercise} — 2026-03-01`]);
  } finally { feed.remove(); }
});

test('hiding the feed ends its subscription', async () => {
  const before = subscriberCount();
  const feed = mountFeed();
  await tick();
  feed.remove();
  await tick();
  expect(subscriberCount() - before, 'subscriptions left after the feed was hidden').toBe(0);
});

test('showing the feed again still gives one row per completion', async () => {
  const first = mountFeed();
  await tick();
  first.remove();
  const again = mountFeed();
  try {
    await tick();
    publishNow(completion(L.water, '2026-03-02'));
    await tick();
    expect(again.rows(), 'rows after showing the feed again and one completion').toEqual([`${L.water} — 2026-03-02`]);
  } finally { again.remove(); }
});

// The seeded regression, rebuilt here: the effect subscribes and never ends the subscription.
function SeededHabitFeed() {
  const h = createElement;
  const [records, setRecords] = useState([]);
  useEffect(() => {
    subscribe((record) => setRecords((current) => [...current, record]));
  }, []);
  return h('section', null,
    h('h2', null, L.feedHeading),
    records.length === 0
      ? h('p', null, L.empty)
      : h('ul', null, records.map((record) => h('li', { key: record.id }, record.habit, ' — ', record.date))));
}

async function runSuite(replacement) {
  testing.restoreComponents();
  if (replacement) {
    testing.replaceComponent(HabitFeed, replacement);
    testing.setDefaultTimeout(800);
  }
  try {
    return await testing.run({ print: false, bail: Boolean(replacement) });
  } finally {
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

let passesWithLearnerCode = false;

test('your tests pass with your HabitFeed', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in HabitFeed.test.jsx').toBeGreaterThanOrEqual(2);
  expect(failing(results), 'your tests that fail with your HabitFeed').toEqual([]);
  passesWithLearnerCode = true;
});

test('one of your tests fails with the seeded HabitFeed', async () => {
  expect(passesWithLearnerCode, 'your tests pass with your HabitFeed (the previous check)').toBe(true);
  const results = await runSuite(SeededHabitFeed);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the seeded HabitFeed').toBe(true);
});
