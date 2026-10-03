import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { server } from './wishes';

// The page's own copy is taken off the page, so ids stay unique while each check mounts a fresh copy.
document.getElementById('root')?.remove();

async function mount() {
  server.failNext = false;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('form') !== null);
  const q = (selector) => host.querySelector(selector);
  return { host, q, finish: () => { root.unmount(); host.remove(); } };
}
const described = (field) =>
  (field.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent.trim() ?? '').join(' ');
const alerts = (host) => [...host.querySelectorAll('[role="alert"]')].map((el) => el.textContent.trim()).filter(Boolean);
async function submit(copy, name, price) {
  await user.fill(copy.q('#wish-name'), name);
  await user.fill(copy.q('#wish-price'), price);
  await user.click(copy.q('button[type="submit"]'));
  await sleep(80);
}
// The element that holds focus after a failed check and lists the problems.
const summaryOf = (host) => (document.activeElement && host.contains(document.activeElement) && document.activeElement.tagName !== 'BUTTON' && document.activeElement.tagName !== 'INPUT' ? document.activeElement : null);

test('a field error is next to its field: aria-invalid and aria-describedby', async () => {
  const copy = await mount();
  try {
    await submit(copy, '', '25');
    expect(copy.q('#wish-name').getAttribute('aria-invalid'), 'aria-invalid of the name field').toBe('true');
    expect(described(copy.q('#wish-name')), 'the description of the name field').toBe(L.nameRequired);
    expect(copy.q('#wish-price').getAttribute('aria-invalid'), 'aria-invalid of the valid price field').not.toBe('true');
  } finally { copy.finish(); }
});

test('a failed check moves focus to a summary of field and form errors', async () => {
  const copy = await mount();
  try {
    await submit(copy, '', '2.5');
    const summary = summaryOf(copy.host);
    expect(summary, 'the focused element after a failed check (not a button or a field)').toBeTruthy();
    expect(summary.textContent, 'the summary').toContain(L.nameRequired);
    expect(summary.textContent, 'the summary').toContain(L.priceNotWhole);
  } finally { copy.finish(); }
});

test('a duplicate name is a form error: in the summary, no field marked invalid', async () => {
  const copy = await mount();
  try {
    await submit(copy, L.lamp.toUpperCase(), '');
    const summary = summaryOf(copy.host);
    expect(summary?.textContent ?? '', 'the focused summary').toContain(L.duplicate);
    expect(copy.q('#wish-name').getAttribute('aria-invalid'), 'aria-invalid of the name field').not.toBe('true');
    expect(described(copy.q('#wish-name')), 'the description of the name field').toBe('');
  } finally { copy.finish(); }
});

test('a rejected save is announced in role=alert and focus is not moved', async () => {
  const copy = await mount();
  try {
    await user.fill(copy.q('#wish-name'), L.bike);
    await user.fill(copy.q('#wish-price'), '240');
    server.failNext = true;
    copy.q('button[type="submit"]').focus();
    await user.click(copy.q('button[type="submit"]'));
    await sleep(80);
    expect(alerts(copy.host), 'texts of role="alert" elements').toEqual([L.saveFailed]);
    expect(document.activeElement === copy.q('button[type="submit"]'), 'focus is still on the Save button').toBe(true);
  } finally { copy.finish(); }
});

test('a rejected save keeps the draft in the fields', async () => {
  const copy = await mount();
  try {
    server.failNext = true;
    await submit(copy, L.bike, '240');
    expect(copy.q('#wish-name'), 'the name field after a rejected save').toHaveValue(L.bike);
    expect(copy.q('#wish-price'), 'the price field after a rejected save').toHaveValue('240');
  } finally { copy.finish(); }
});

test('a successful save clears every error and adds the wish', async () => {
  const copy = await mount();
  try {
    await submit(copy, '', '');
    server.failNext = true;
    await submit(copy, L.bike, '240');
    await submit(copy, L.bike, '240');
    expect(alerts(copy.host), 'texts of role="alert" elements').toEqual([]);
    expect(copy.q('#wish-name').getAttribute('aria-invalid'), 'aria-invalid of the name field').not.toBe('true');
    expect(copy.host.textContent, 'the form after the save').not.toContain(L.nameRequired);
    expect([...copy.q('[data-part="wishes"]').children].map((li) => li.textContent), 'the wish list').toEqual([L.headphones, L.lamp, L.bike]);
  } finally { copy.finish(); }
});
