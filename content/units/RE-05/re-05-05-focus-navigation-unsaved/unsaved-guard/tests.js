import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

document.getElementById('root')?.remove();

// Every check mounts its own copy and tracks the beforeunload listeners that copy adds and removes.
async function mount() {
  const nativeAdd = window.addEventListener;
  const nativeRemove = window.removeEventListener;
  const live = new Set();
  window.addEventListener = function (type, listener, options) {
    if (type === 'beforeunload') live.add(listener);
    return nativeAdd.call(this, type, listener, options);
  };
  window.removeEventListener = function (type, listener, options) {
    if (type === 'beforeunload') live.delete(listener);
    return nativeRemove.call(this, type, listener, options);
  };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('ul') !== null);
  const find = (role, text) => [...host.querySelectorAll(role === 'link' ? 'a' : 'button')].find((el) => el.textContent.includes(text));
  const click = async (role, text) => {
    const el = find(role, text);
    expect(el, `${role} "${text}"`).toBeDefined();
    await user.click(el);
    await settle();
  };
  const finish = () => {
    for (const listener of live) nativeRemove.call(window, 'beforeunload', listener);
    root.unmount();
    host.remove();
    window.addEventListener = nativeAdd;
    window.removeEventListener = nativeRemove;
  };
  return {
    host, live, click, finish,
    heading: () => host.querySelector('main h1')?.textContent,
    dialog: () => host.querySelector('[role="alertdialog"]'),
    field: () => host.querySelector('#habit-name'),
    openEdit: async () => { await click('link', L.reading); await click('link', L.edit); },
  };
}
function reloadIsCanceled() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

test('leaving an unchanged form does not ask', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await copy.click('button', L.back);
    expect(copy.dialog(), 'confirmation after Back from an unchanged form').toBeNull();
    expect(copy.heading(), 'screen after Back').toBe(L.reading);
  } finally { copy.finish(); }
});

test('Back from a changed form asks first, and Stay keeps the draft', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field(), '!');
    await copy.click('button', L.back);
    expect(copy.dialog(), 'confirmation after Back from a changed form').not.toBeNull();
    expect(copy.heading(), 'screen while the confirmation is open').toBe(L.editing);
    await copy.click('button', L.stay);
    expect(copy.dialog(), 'confirmation after Stay').toBeNull();
    expect(copy.field()?.value, 'the draft after Stay').toBe(`${L.reading}!`);
  } finally { copy.finish(); }
});

test('Leave goes back without saving', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field(), '!');
    await copy.click('button', L.back);
    await copy.click('button', L.leave);
    expect(copy.heading(), 'screen after Leave').toBe(L.reading);
  } finally { copy.finish(); }
});

test('a link to another habit from a changed form also asks', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field(), '!');
    await copy.click('link', L.water);
    expect(copy.dialog(), 'confirmation after clicking another habit').not.toBeNull();
  } finally { copy.finish(); }
});

test('reloading is guarded only while the form is changed', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    expect(reloadIsCanceled(), 'beforeunload canceled for an unchanged form').toBe(false);
    await user.type(copy.field(), '!');
    await settle();
    expect(reloadIsCanceled(), 'beforeunload canceled for a changed form').toBe(true);
    await user.clear(copy.field());
    await user.type(copy.field(), L.reading);
    await settle();
    expect(reloadIsCanceled(), 'beforeunload canceled after typing the saved name back').toBe(false);
  } finally { copy.finish(); }
});

test('leaving the edit screen removes the beforeunload listener', async () => {
  const copy = await mount();
  try {
    await copy.openEdit();
    await user.type(copy.field(), '!');
    await copy.click('button', L.back);
    await copy.click('button', L.leave);
    expect(copy.live.size, 'beforeunload listeners still attached after leaving').toBe(0);
    expect(reloadIsCanceled(), 'beforeunload canceled after leaving the form').toBe(false);
  } finally { copy.finish(); }
});
