import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import HelpPage from './HelpPage';
import { helpProps } from './help-data';

// Renders HelpPage into a detached element and returns its HTML, as a build step would.
function markupOf(props) {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(HelpPage, props)));
    return host.innerHTML;
  } finally {
    root.unmount();
  }
}

const textOf = (html) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.textContent.replace(/\s+/g, ' ');
};

test('shows the title, the date from updatedOn and every question with its answer', () => {
  const text = textOf(markupOf(helpProps));
  expect(text, 'the page text').toContain(L.title);
  expect(text, 'the page text').toContain(`${L.updated}: 2026-03-01`);
  for (const item of helpProps.questions) {
    expect(text, `the page text, question "${item.question}"`).toContain(item.question);
    expect(text, `the page text, answer to "${item.question}"`).toContain(item.answer);
  }
});

test('the same props give the same markup when the clock changes', () => {
  const RealDate = Date;
  const first = markupOf(helpProps);
  const shift = 400 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000;
  class LaterDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(RealDate.now() + shift);
      else super(...args);
    }
    static now() {
      return RealDate.now() + shift;
    }
  }
  globalThis.Date = LaterDate;
  let second;
  try {
    second = markupOf(helpProps);
  } finally {
    globalThis.Date = RealDate;
  }
  expect(second, 'the markup rendered 400 days later').toBe(first);
});

test('the same props give the same markup when stored values change', () => {
  // Every key answers the same stored value: null for the first render, a question id for the second.
  const storageAnswering = (value) => ({ getItem: () => value, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 });
  const real = Object.getOwnPropertyDescriptor(window, 'localStorage');
  let first;
  let second;
  try {
    Object.defineProperty(window, 'localStorage', { value: storageAnswering(null), configurable: true });
    first = markupOf(helpProps);
    Object.defineProperty(window, 'localStorage', { value: storageAnswering(helpProps.questions[1].id), configurable: true });
    second = markupOf(helpProps);
  } finally {
    Object.defineProperty(window, 'localStorage', real);
  }
  expect(second, 'the markup rendered with other values in localStorage').toBe(first);
});
