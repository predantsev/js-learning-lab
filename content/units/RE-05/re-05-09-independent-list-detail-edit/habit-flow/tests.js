import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setNextOutcome } from './habitsApi.js';

document.getElementById('root')?.remove();

// Every check mounts its own copy of the app; the fake server answers after 300 ms.
async function mount(outcome = 'ok', initialPath) {
  setNextOutcome(outcome);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App, initialPath ? { initialPath } : {}));
  await waitFor(() => host.childElementCount > 0);
  const all = (selector) => [...host.querySelectorAll(selector)];
  const copy = {
    host,
    statusText: () => host.querySelector('[role="status"]')?.textContent.trim() ?? '(no role="status" element)',
    heading: () => host.querySelector('main h1'),
    headingText: () => host.querySelector('main h1')?.textContent ?? '(no <h1> in <main>)',
    dialog: () => host.querySelector('[role="alertdialog"]'),
    listNames: () => all('ul a').map((a) => a.textContent),
    field: (id) => host.querySelector(`#${id}`),
    async loaded() {
      await waitFor(() => copy.statusText() !== L.loading, { timeout: 2500 }).catch(() => {});
    },
    async click(selector, text) {
      const el = all(selector).find((candidate) => candidate.textContent.includes(text));
      expect(el, `"${text}" on the page`).toBeDefined();
      await user.click(el);
      await settle();
    },
    async goBack() {
      await copy.click('button', L.back);
    },
    async openEdit(name) {
      await copy.loaded();
      await copy.click('ul a', name);
      await copy.click('main a', L.edit);
    },
    finish: () => { root.unmount(); host.remove(); setNextOutcome('ok'); },
  };
  return copy;
}
function reloadIsCanceled() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

test('the list shows a loading status, then the habits', async () => {
  const copy = await mount('ok');
  try {
    expect(copy.statusText(), 'status right after mounting').toBe(L.loading);
    await copy.loaded();
    expect(copy.statusText(), 'status after loading').toBe(`${L.count} 3`);
    expect(copy.listNames(), 'links in the list').toEqual([L.exercise, L.reading, L.tidy]);
  } finally { copy.finish(); }
});

test('an empty list says so and shows no list', async () => {
  const copy = await mount('empty');
  try {
    await copy.loaded();
    expect(copy.statusText(), 'status for an empty list').toBe(L.empty);
    expect(copy.listNames(), 'links in the list').toEqual([]);
  } finally { copy.finish(); }
});

test('a failed load shows its own error and a retry that loads again', async () => {
  const copy = await mount('fail');
  try {
    await copy.loaded();
    expect(copy.statusText(), 'status after a failed load').toBe(L.loadFailed);
    setNextOutcome('ok');
    await copy.click('button', L.retry);
    expect(copy.statusText(), 'status right after Retry').toBe(L.loading);
    await copy.loaded();
    expect(copy.listNames(), 'links after a successful retry').toEqual([L.exercise, L.reading, L.tidy]);
  } finally { copy.finish(); }
});

test('opening a habit shows its details and moves focus to its heading', async () => {
  const copy = await mount();
  try {
    await copy.loaded();
    await copy.click('ul a', L.tidy);
    expect(copy.headingText(), 'heading of the detail screen').toBe(L.tidy);
    expect(copy.host.querySelector('main')?.textContent, 'the detail screen').toContain(L.weekly);
    expect(document.activeElement === copy.heading(), 'focus on the detail heading').toBe(true);
    await copy.click('main a', L.edit);
    expect(document.activeElement === copy.heading(), 'focus on the edit heading').toBe(true);
  } finally { copy.finish(); }
});

test('an unknown id shows the not-found screen, on detail and on edit', async () => {
  for (const path of ['/habits/h-99', '/habits/h-99/edit']) {
    const copy = await mount('ok', path);
    try {
      await copy.loaded();
      expect(copy.headingText(), `heading at ${path}`).toBe(L.notFound);
      expect(copy.listNames(), `the list next to ${path}`).toHaveLength(3);
    } finally { copy.finish(); }
  }
});

test('Back from an unchanged edit form leaves without asking', async () => {
  const copy = await mount();
  try {
    await copy.openEdit(L.reading);
    await copy.goBack();
    expect(copy.dialog(), 'confirmation after Back from an unchanged form').toBeNull();
    expect(copy.headingText(), 'screen after Back').toBe(L.reading);
  } finally { copy.finish(); }
});

test('Back from a changed edit form asks; Stay keeps the draft, Leave discards it', async () => {
  const copy = await mount();
  try {
    await copy.openEdit(L.reading);
    await user.type(copy.field('habit-name'), '!');
    await copy.goBack();
    expect(copy.dialog(), 'confirmation after Back from a changed form').not.toBeNull();
    await copy.click('button', L.stay);
    expect(copy.field('habit-name')?.value, 'the name after Stay').toBe(`${L.reading}!`);
    await copy.click('ul a', L.tidy);
    expect(copy.dialog(), 'confirmation after clicking another habit').not.toBeNull();
    await copy.click('button', L.leave);
    expect(copy.headingText(), 'screen after Leave').toBe(L.tidy);
    expect(copy.listNames(), 'the list after Leave').toEqual([L.exercise, L.reading, L.tidy]);
  } finally { copy.finish(); }
});

test('reloading is guarded only while the edit form is changed', async () => {
  const copy = await mount();
  try {
    await copy.openEdit(L.exercise);
    expect(reloadIsCanceled(), 'beforeunload canceled for an unchanged form').toBe(false);
    await user.select(copy.field('habit-frequency'), 'weekly');
    await settle();
    expect(reloadIsCanceled(), 'beforeunload canceled after changing the frequency').toBe(true);
    await user.select(copy.field('habit-frequency'), 'daily');
    await settle();
    expect(reloadIsCanceled(), 'beforeunload canceled after changing the frequency back').toBe(false);
  } finally { copy.finish(); }
});

test('submitting an empty name by keyboard shows an accessible error and focuses the field', async () => {
  const copy = await mount();
  try {
    await copy.openEdit(L.exercise);
    const name = copy.field('habit-name');
    await user.clear(name);
    await user.press('Enter', name);
    await settle();
    await waitFor(() => document.activeElement === copy.field('habit-name')).catch(() => {});
    const field = copy.field('habit-name');
    expect(field?.getAttribute('aria-invalid'), 'aria-invalid of the name field').toBe('true');
    const described = (field?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    expect(described, 'text the name field is described by').toBe(L.nameRequired);
    expect(document.activeElement === field, 'focus on the name field after the failed submit').toBe(true);
    expect(copy.headingText(), 'still on the edit screen').toBe(L.editing);
  } finally { copy.finish(); }
});

test('a valid edit is saved without asking and shown on the detail screen', async () => {
  const copy = await mount();
  try {
    await copy.openEdit(L.exercise);
    await user.clear(copy.field('habit-name'));
    await user.type(copy.field('habit-name'), `  ${L.walk}  `);
    await user.select(copy.field('habit-frequency'), 'weekly');
    await copy.click('form button', L.save);
    expect(copy.dialog(), 'confirmation after Save').toBeNull();
    expect(copy.headingText(), 'detail heading after Save').toBe(L.walk);
    expect(copy.host.querySelector('main')?.textContent, 'the detail screen after Save').toContain(L.weekly);
    expect(document.activeElement === copy.heading(), 'focus on the detail heading after Save').toBe(true);
    expect(copy.listNames(), 'the list after Save').toEqual([L.walk, L.reading, L.tidy]);
    await copy.goBack();
    expect(copy.headingText(), 'screen after Back from the saved detail').not.toBe(L.editing);
  } finally { copy.finish(); }
});
