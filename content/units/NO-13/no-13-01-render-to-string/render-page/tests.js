import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';
import { renderPage } from './page.js';

// Fresh data inside the checks (the driver must not share a mutable object with them).
const two = () => [
  { id: 'h-01', name: L.exercise, completions: ['2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.water, completions: ['2026-03-01'] },
];
const other = () => [{ id: 'h-09', name: L.walk, completions: [] }];

function page(habits) {
  expect(typeof renderPage, 'type of renderPage').toBe('function');
  const html = renderPage(habits);
  expect(typeof html, 'type of what renderPage returns').toBe('string');
  return html;
}

test('the document starts with a doctype and has head and body', () => {
  const html = page(two());
  expect(/^\s*<!doctype html>/i.test(html), 'the text starts with <!doctype html>').toBe(true);
  for (const tag of ['<html', '<head>', '</head>', '<body>', '</body>', '</html>']) {
    expect(html.toLowerCase().includes(tag), `the document contains ${tag}`).toBe(true);
  }
});

test('the head declares UTF-8', () => {
  expect(/<meta charset="utf-8"\s*\/?>/i.test(page(two())), '<meta charset="utf-8"> in the document').toBe(true);
});

test('the root element holds exactly the rendered list', () => {
  const habits = two();
  const expected = `<div id="root">${renderToString(h(HabitList, { habits }))}</div>`;
  expect(page(habits), 'the document').toContain(expected);
});

test('the list comes from the habits it is given', () => {
  const habits = other();
  const html = page(habits);
  expect(html, 'the document for one other habit').toContain(renderToString(h(HabitList, { habits })));
  expect(html.includes(L.exercise), 'a habit that was not passed in').toBe(false);
});

test('the page loads /client.js as a module', () => {
  const tags = page(two()).match(/<script\b[^>]*>/gi) ?? [];
  const entry = tags.find((tag) => /\bsrc="\/client\.js"/.test(tag));
  expect(entry, 'a <script> tag with src="/client.js"').toBeDefined();
  expect(/\btype="module"/.test(entry), `type="module" on ${entry}`).toBe(true);
});
