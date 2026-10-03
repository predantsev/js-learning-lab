import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

document.getElementById('root')?.remove();

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('ul a') !== null);
  const find = (selector, text) => [...host.querySelectorAll(selector)].find((el) => el.textContent.includes(text));
  const click = async (selector, text) => {
    const el = find(selector, text);
    expect(el, `"${text}" on the page`).toBeDefined();
    await user.click(el);
    await settle();
  };
  return {
    host, click,
    heading: () => host.querySelector('main h1'),
    dialog: () => host.querySelector('[role="alertdialog"]'),
    field: (name) => host.querySelector(`#expense-${name}`),
    openEdit: async () => { await click('ul a', L.transit); await click('main a', L.edit); },
    finish: () => { root.unmount(); host.remove(); },
  };
}
function reloadIsCanceled() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
const controlledWarnings = () => rawLogs().filter((entry) => entry.args.some((arg) => typeof arg === 'string' && arg.includes('uncontrolled input to be controlled')));

test('the amount field starts with the saved amount and stays controlled', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    expect(copy.field('amount')?.value, 'the amount field of Transit pass').toBe('520.00');
    await user.type(copy.field('amount'), '5');
    await settle();
    expect(copy.field('amount')?.value, 'the amount field after typing 5').toBe('520.005');
    expect(controlledWarnings().length, 'React warnings about an uncontrolled input becoming controlled').toBe(0);
  } finally { copy.finish(); }
});

test('Back from an unchanged form leaves without asking', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await copy.click('button', L.back);
    expect(copy.dialog(), 'confirmation after Back from an unchanged form').toBeNull();
    expect(copy.heading()?.textContent, 'screen after Back').toBe(L.transit);
  } finally { copy.finish(); }
});

test('Back from a changed form asks first, and Stay keeps the draft', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field('label'), '!');
    await copy.click('button', L.back);
    expect(copy.dialog(), 'confirmation after Back from a changed form').not.toBeNull();
    await copy.click('button', L.stay);
    expect(copy.field('label')?.value, 'the label after Stay').toBe(`${L.transit}!`);
  } finally { copy.finish(); }
});

test('opening another expense from a changed form asks first', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field('label'), '!');
    await copy.click('ul a', L.bulbs);
    expect(copy.dialog(), 'confirmation after clicking another expense').not.toBeNull();
    await copy.click('button', L.leave);
    expect(copy.heading()?.textContent, 'screen after Leave').toBe(L.bulbs);
  } finally { copy.finish(); }
});

test('reloading is guarded only while the form is changed', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    expect(reloadIsCanceled(), 'beforeunload canceled for an unchanged form').toBe(false);
    await user.type(copy.field('label'), '!');
    await settle();
    expect(reloadIsCanceled(), 'beforeunload canceled for a changed form').toBe(true);
  } finally { copy.finish(); }
});

test('Save stores the edits without asking', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.clear(copy.field('amount'));
    await user.type(copy.field('amount'), '480');
    await copy.click('button', L.save);
    expect(copy.dialog(), 'confirmation after Save').toBeNull();
    expect(copy.host.querySelector('main p')?.textContent, 'amount on the detail screen after Save').toContain('480.00');
  } finally { copy.finish(); }
});

test('after every route change focus is on the new screen heading', async () => {
  const copy = await mount();
  try {
    await copy.click('ul a', L.transit);
    expect(document.activeElement === copy.heading(), `focus on the heading "${L.transit}" after opening the expense`).toBe(true);
    await copy.click('main a', L.edit);
    expect(document.activeElement === copy.heading(), 'focus on the edit screen heading after Edit').toBe(true);
    await copy.click('button', L.save);
    expect(document.activeElement === copy.heading(), 'focus on the detail heading after Save').toBe(true);
  } finally { copy.finish(); }
});
