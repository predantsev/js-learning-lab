import { Component, StrictMode, createElement, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as testing from './testing.js';
import CompletionFeed from './CompletionFeed';
import GoalPanel from './GoalPanel';
import HabitSearch from './HabitSearch';
import MinutesLog from './MinutesLog';
import { completionFeed } from './completionFeed.js';
import { resetFakeSearch } from './fakeSearch.js';
import { searchLab } from './searchLab.js';
import { review } from './review.js';

const h = createElement;
const textOf = (node) => node.textContent.replace(/\s+/g, ' ').trim();

// Catches a render error, so a crash becomes a visible state a check can read.
class Catch extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? h('p', { 'data-crash': 'yes' }, String(this.state.error.message)) : this.props.children;
  }
}

async function mount(element) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(h(StrictMode, null, h(Catch, null, element))));
  await settle();
  return { container, unmount: () => { flushSync(() => root.unmount()); container.remove(); } };
}
const crashed = (container) => container.querySelector('[data-crash]') !== null;
const buttonNamed = (container, name) => [...container.querySelectorAll('button')].find((button) => textOf(button) === name) ?? null;

test('one completion shows one row', async () => {
  const { container, unmount } = await mount(h(CompletionFeed));
  try {
    completionFeed.publish({ id: 'c-check', habit: L.h4, day: '2026-03-03' });
    await settle();
    const rows = [...container.querySelectorAll('li')].filter((li) => textOf(li).includes(L.h4));
    expect(rows.length, `rows after one published completion of "${L.h4}"`).toBe(1);
  } finally {
    unmount();
  }
});

test('the feed leaves no handler behind', async () => {
  const before = completionFeed.handlerCount();
  const { unmount } = await mount(h(CompletionFeed));
  unmount();
  await settle();
  expect(completionFeed.handlerCount() - before, 'handlers left after the feed was shown and removed').toBe(0);
});

test('with the real server the search shows the answer to the last query typed', async () => {
  const response = await fetch(`/lab/search?ns=habits&lang=${L.lang}&q=${encodeURIComponent(L.queryTwo)}&delay=0`);
  const expected = (await response.json()).results.map((habit) => habit.name);
  const { container, unmount } = await mount(h(HabitSearch, { search: searchLab }));
  try {
    const input = container.querySelector('input');
    await user.type(input, L.queryTwo);
    await sleep(900);
    const shown = [...container.querySelectorAll('li')].map(textOf);
    const same = shown.length === expected.length && shown.every((name, index) => name === expected[index]);
    expect(same, `results on the screen after typing "${L.queryTwo}" (got ${JSON.stringify(shown)})`).toBe(true);
  } finally {
    unmount();
  }
});

// The learner's own test, run again with print: false, against a reference or a broken search.
function racySearch() {
  return function RacyHabitSearch({ search }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    useEffect(() => {
      if (query === '') { setResults([]); return; }
      search(query).then(setResults);
    }, [query, search]);
    return h('section', null,
      h('label', null, L.searchLabel, ' ', h('input', { value: query, onChange: (event) => setQuery(event.target.value) })),
      h('ul', { 'aria-label': L.resultsLabel }, results.map((habit) => h('li', { key: habit.id }, habit.name))));
  };
}
function guardedSearch() {
  return function GuardedHabitSearch({ search }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    useEffect(() => {
      if (query === '') { setResults([]); return undefined; }
      let ignore = false;
      search(query).then((found) => { if (!ignore) setResults(found); });
      return () => { ignore = true; };
    }, [query, search]);
    return h('section', null,
      h('label', null, L.searchLabel, ' ', h('input', { value: query, onChange: (event) => setQuery(event.target.value) })),
      h('ul', { 'aria-label': L.resultsLabel }, results.map((habit) => h('li', { key: habit.id }, habit.name))));
  };
}
async function runSuite(replacement) {
  testing.restoreComponents();
  testing.replaceComponent(HabitSearch, replacement);
  testing.setDefaultTimeout(1200);
  try {
    return await testing.run({ print: false, beforeEach: resetFakeSearch });
  } finally {
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
    resetFakeSearch();
  }
}
let suitePasses = false;

test('your search test passes with a search that keeps only the latest answer', async () => {
  const results = await runSuite(guardedSearch());
  expect(results.length >= 1, `number of tests in HabitSearch.test.jsx (got ${results.length})`).toBe(true);
  const failing = results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
  expect(failing, 'your tests that fail with a correct search').toEqual([]);
  suitePasses = true;
});

test('your search test fails with a search that can show a stale answer', async () => {
  expect(suitePasses, 'your test passes with a correct search (the previous check)').toBe(true);
  const results = await runSuite(racySearch());
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the stale-answer search').toBe(true);
});

test('the goal panel opens and closes twice without breaking', async () => {
  const { container, unmount } = await mount(h(GoalPanel));
  try {
    for (let round = 1; round <= 2; round += 1) {
      const show = buttonNamed(container, L.goalShow);
      expect(show !== null && !crashed(container), `a "${L.goalShow}" button (round ${round})`).toBe(true);
      await user.click(show);
      expect(!crashed(container), `the panel after opening (round ${round})`).toBe(true);
      expect(textOf(container).includes(`${L.goalText}: 5`), `the text "${L.goalText}: 5" after opening (round ${round})`).toBe(true);
      await user.click(buttonNamed(container, L.goalHide));
    }
  } finally {
    unmount();
  }
});

test('minutes add up as numbers', async () => {
  const { container, unmount } = await mount(h(MinutesLog));
  try {
    const input = container.querySelector('input');
    const add = buttonNamed(container, L.addMinutes);
    await user.fill(input, '15');
    await user.click(add);
    await user.fill(input, '20');
    await user.click(add);
    const total = textOf(container.querySelector('output'));
    expect(total === '35', `the total after adding 15 and 20 (got "${total}")`).toBe(true);
  } finally {
    unmount();
  }
});

const WHY = new Set(['one-letter-only', 'no-waiting', 'fixture-in-order', 'no-strict-mode']);
const RUNS = new Set(['reload', 'keyboard-only', 'fast-typing-real-server', 'two-tabs']);

test('review says why the provided test was green', () => {
  expect(WHY.has(review?.whyGreen), `review.whyGreen is one of the listed ids (got ${JSON.stringify(review?.whyGreen)})`).toBe(true);
  expect(review.whyGreen === 'fixture-in-order', `review.whyGreen (got ${JSON.stringify(review.whyGreen)})`).toBe(true);
});

test('review names the run that reveals it', () => {
  expect(RUNS.has(review?.revealingRun), `review.revealingRun is one of the listed ids (got ${JSON.stringify(review?.revealingRun)})`).toBe(true);
  expect(review.revealingRun === 'fast-typing-real-server', `review.revealingRun (got ${JSON.stringify(review.revealingRun)})`).toBe(true);
});
