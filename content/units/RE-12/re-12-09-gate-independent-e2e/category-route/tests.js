import { createElement, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as testing from './testing.js';
import App from './App';
import { Link, createMemoryHistory, useParams } from './router';
import { categories, expenses } from './expensesData';
import { categoryPageOverride } from './seam.js';
import { writeup } from './writeup.js';

const h = createElement;
const textOf = (node) => node.textContent.replace(/\s+/g, ' ').trim();
const nameOf = (id) => categories.find((category) => category.id === id).name;
const money = (minor) => `${(minor / 100).toFixed(2)} ${L.currency}`;

async function mountAt(path) {
  const history = createMemoryHistory(path);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(h(App, { history })));
  await settle();
  return { history, container, unmount: () => { flushSync(() => root.unmount()); container.remove(); } };
}
const headingText = (container) => textOf(container.querySelector('h1') ?? { textContent: '' });

test('the expenses list links every category to its page', async () => {
  const { container, unmount } = await mountAt('/expenses');
  try {
    for (const category of categories) {
      const link = [...container.querySelectorAll('main a[href]')].find((a) => textOf(a) === category.name);
      expect(link?.getAttribute('href') === `/categories/${category.id}`, `a link "${category.name}" in the list leading to /categories/${category.id}`).toBe(true);
    }
  } finally {
    unmount();
  }
});

test('a category page shows its name, its total and only its expenses', async () => {
  const { container, unmount } = await mountAt('/categories/food');
  try {
    expect(headingText(container) === L.food, `the h1 at /categories/food (got "${headingText(container)}")`).toBe(true);
    expect(textOf(container).includes(`${L.total}: ${money(105600)}`), `the text "${L.total}: ${money(105600)}"`).toBe(true);
    const rows = [...container.querySelectorAll('main li')].map(textOf);
    const food = expenses.filter((expense) => expense.category === 'food').map((expense) => expense.label);
    const ok = rows.length === food.length && food.every((label) => rows.some((row) => row.includes(label)));
    expect(ok, `rows at /categories/food (got ${JSON.stringify(rows)})`).toBe(true);
  } finally {
    unmount();
  }
});

test('following a category link moves focus to the new heading and sets the title', async () => {
  const { container, unmount } = await mountAt('/expenses');
  try {
    const link = [...container.querySelectorAll('main a[href]')].find((a) => textOf(a) === L.transport);
    expect(link !== undefined, `a link "${L.transport}" in the list`).toBe(true);
    await user.click(link);
    await settle();
    const heading = container.querySelector('h1');
    expect(heading !== null && textOf(heading) === L.transport, `the h1 after following the link (got "${headingText(container)}")`).toBe(true);
    expect(document.activeElement === heading, 'focus is on the new h1 after following the link').toBe(true);
    expect(document.title.includes(L.transport), `document.title contains "${L.transport}" (got "${document.title}")`).toBe(true);
  } finally {
    unmount();
  }
});

test('the first open of a category page leaves focus where it was', async () => {
  document.body.focus();
  const { container, unmount } = await mountAt('/categories/home');
  try {
    expect(document.activeElement !== container.querySelector('h1'), 'focus on the h1 right after the first open').toBe(true);
  } finally {
    unmount();
  }
});

test('an unknown category shows a not-found heading with a way back', async () => {
  const { container, unmount } = await mountAt('/categories/rent');
  try {
    expect(headingText(container) === L.notFound, `the h1 at /categories/rent (got "${headingText(container)}")`).toBe(true);
    const back = [...container.querySelectorAll('main a[href]')].find((a) => a.getAttribute('href') === '/expenses');
    expect(back !== undefined, 'a link to /expenses inside the page').toBe(true);
  } finally {
    unmount();
  }
});

test('moving from one category to another shows the new one', async () => {
  const { history, container, unmount } = await mountAt('/categories/food');
  try {
    history.push('/categories/fun');
    await settle();
    expect(headingText(container) === L.fun, `the h1 after moving to /categories/fun (got "${headingText(container)}")`).toBe(true);
    expect(textOf(container).includes(`${L.total}: ${money(48000)}`), `the text "${L.total}: ${money(48000)}"`).toBe(true);
  } finally {
    unmount();
  }
});

// ---- your tests, run again against other versions of the page ----
function page({ total = 'own', unknown = 'message', stale = false }) {
  return function OtherCategoryPage() {
    const { id: paramId } = useParams();
    const [firstId] = useState(paramId);
    const id = stale ? firstId : paramId;
    const category = categories.find((item) => item.id === id);
    if (!category) {
      if (unknown === 'nothing') return null;
      return h('section', null, h('h1', { tabIndex: -1 }, L.notFound), h(Link, { to: '/expenses' }, L.backToList));
    }
    const items = expenses.filter((expense) => expense.category === id);
    const sumOf = total === 'all' ? expenses : items;
    const totalMinor = sumOf.reduce((sum, expense) => sum + expense.amountMinor, 0);
    return h('section', null,
      h('h1', { tabIndex: -1 }, category.name),
      h('p', null, `${L.total}: ${money(totalMinor)}`),
      h('ul', null, items.map((expense) => h('li', { key: expense.id }, `${expense.label} — ${money(expense.amountMinor)}`))));
  };
}
async function runSuite(version) {
  categoryPageOverride.current = version;
  testing.setDefaultTimeout(800);
  try {
    return await testing.run({ print: false, bail: true });
  } finally {
    categoryPageOverride.current = null;
    testing.setDefaultTimeout(2000);
  }
}
let suitePasses = false;
async function expectCaught(version) {
  expect(suitePasses, 'your tests pass with a correct page (the first check of your tests)').toBe(true);
  const results = await runSuite(version);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with this version').toBe(true);
}

test('your tests pass with a correct category page', async () => {
  categoryPageOverride.current = page({});
  try {
    const results = await testing.run({ print: false });
    expect(results.length >= 3, `number of tests in CategoryPage.test.jsx (got ${results.length})`).toBe(true);
    const failing = results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
    expect(failing, 'your tests that fail with a correct page').toEqual([]);
    suitePasses = true;
  } finally {
    categoryPageOverride.current = null;
  }
});

test('your tests fail with a page whose total is wrong', async () => {
  await expectCaught(page({ total: 'all' }));
});

test('your tests fail with a page that shows nothing for an unknown category', async () => {
  await expectCaught(page({ unknown: 'nothing' }));
});

test('your tests fail with a page that keeps the first category after moving to another', async () => {
  await expectCaught(page({ stale: true }));
});

test('the write-up explains state and data in at least two sentences', () => {
  const text = typeof writeup === 'string' ? writeup.trim() : '';
  const sentences = text.split(/[.!?](\s|$)/).filter((part) => part && part.trim().length > 10).length;
  expect(text.length >= 120, `write-up length (got ${text.length} characters)`).toBe(true);
  expect(sentences >= 2, `sentences in the write-up (got ${sentences})`).toBe(true);
  expect(text.includes('useParams'), 'the write-up names useParams').toBe(true);
  expect(text.includes('amountMinor'), 'the write-up names amountMinor').toBe(true);
});
