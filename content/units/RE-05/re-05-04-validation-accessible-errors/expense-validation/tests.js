import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// The page's own copy is taken off the page, so ids stay unique while each check mounts a fresh copy.
document.getElementById('root')?.remove();

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('form') !== null);
  const q = (selector) => host.querySelector(selector);
  return { host, q, finish: () => { root.unmount(); host.remove(); } };
}
const describedText = (field) =>
  (field.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
async function fillAndSubmit(copy, { label = '', amount = '', category = '' }) {
  await user.clear(copy.q('#expense-label'));
  if (label) await user.type(copy.q('#expense-label'), label);
  await user.clear(copy.q('#expense-amount'));
  if (amount) await user.type(copy.q('#expense-amount'), amount);
  await user.select(copy.q('#expense-category'), category);
  await user.click(copy.q('form button'));
  await settle();
}

test('no errors are shown before the first submit', async () => {
  const copy = await mount();
  try {
    await user.type(copy.q('#expense-amount'), 'abc');
    await settle();
    expect(copy.q('#error-summary'), 'the summary before any submit').toBeNull();
    expect(copy.q('#expense-amount-error'), 'the amount message before any submit').toBeNull();
    expect(copy.q('#expense-amount').getAttribute('aria-invalid'), 'aria-invalid of the amount before any submit').not.toBe('true');
  } finally { copy.finish(); }
});

test('each invalid field is marked invalid and described by its message', async () => {
  const copy = await mount();
  try {
    await fillAndSubmit(copy, { label: '', amount: '0', category: '' });
    for (const [field, message] of [['label', L.labelRequired], ['amount', L.amountPositive], ['category', L.categoryRequired]]) {
      const input = copy.q(`#expense-${field}`);
      expect(input.getAttribute('aria-invalid'), `aria-invalid of the ${field} field`).toBe('true');
      expect(describedText(input), `text that aria-describedby of the ${field} field points to`).toBe(message);
    }
  } finally { copy.finish(); }
});

test('a valid field is not marked invalid', async () => {
  const copy = await mount();
  try {
    await fillAndSubmit(copy, { label: L.lunch, amount: 'abc', category: 'food' });
    expect(copy.q('#expense-amount').getAttribute('aria-invalid'), 'aria-invalid of the amount').toBe('true');
    expect(copy.q('#expense-label').getAttribute('aria-invalid'), 'aria-invalid of the label').not.toBe('true');
    expect(copy.q('#expense-category').getAttribute('aria-invalid'), 'aria-invalid of the category').not.toBe('true');
    expect(copy.q('#expense-label-error'), 'a message for the valid label').toBeNull();
  } finally { copy.finish(); }
});

test('the summary lists links to the invalid fields in form order', async () => {
  const copy = await mount();
  try {
    await fillAndSubmit(copy, { label: '', amount: '12.5', category: '' });
    const summary = copy.q('#error-summary');
    expect(summary, 'the element #error-summary').not.toBeNull();
    expect(summary.querySelector('h2')?.textContent, 'heading of the summary').toBe(L.summaryTitle);
    const links = [...summary.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]);
    expect(links, 'links in the summary').toEqual([['#expense-label', L.labelRequired], ['#expense-category', L.categoryRequired]]);
  } finally { copy.finish(); }
});

test('a failed submit moves focus to the summary, every time', async () => {
  const copy = await mount();
  try {
    await fillAndSubmit(copy, { label: L.lunch, amount: '', category: 'food' });
    await waitFor(() => document.activeElement === copy.q('#error-summary')).catch(() => {});
    expect(document.activeElement?.id, 'id of the focused element after the first failed submit').toBe('error-summary');
    await fillAndSubmit(copy, { label: '', amount: '210.50', category: 'food' });
    await waitFor(() => document.activeElement === copy.q('#error-summary')).catch(() => {});
    expect(document.activeElement?.id, 'id of the focused element after the second failed submit').toBe('error-summary');
  } finally { copy.finish(); }
});

test('after fixing the errors, submitting saves the expense and clears the errors', async () => {
  const copy = await mount();
  try {
    await fillAndSubmit(copy, { label: '', amount: '', category: '' });
    await fillAndSubmit(copy, { label: L.lunch, amount: '210.50', category: 'food' });
    expect([...copy.host.querySelectorAll('li')].map((li) => li.textContent), 'saved expenses').toEqual([`${L.lunch} — 210.50`]);
    expect(copy.q('#error-summary'), 'the summary after a successful save').toBeNull();
    expect(copy.q('#expense-label').getAttribute('aria-invalid'), 'aria-invalid of the label after saving').not.toBe('true');
  } finally { copy.finish(); }
});
