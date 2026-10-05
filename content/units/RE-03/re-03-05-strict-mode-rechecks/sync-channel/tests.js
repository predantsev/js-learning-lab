import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { liveConnections } from './channel.js';

// Every check mounts its own copy under StrictMode, as main.jsx does, and reads the channel's
// live connections. The copy rendered by main.jsx keeps its own connection to "home" while the
// checks run, so the checks count only what appeared after their own mount.
function without(base, list) {
  const rest = [...list];
  for (const item of base) {
    const index = rest.indexOf(item);
    if (index !== -1) rest.splice(index, 1);
  }
  return rest;
}
async function mount() {
  const before = liveConnections();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(StrictMode, null, createElement(App)));
  await waitFor(() => host.querySelector('p') !== null);
  await settle();
  let mounted = true;
  return {
    host,
    added: () => without(before, liveConnections()),
    unmount: () => { if (mounted) { mounted = false; root.unmount(); } },
  };
}
const buttonByText = (host, text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);

test('mounting under StrictMode leaves exactly one connection', async () => {
  const copy = await mount();
  try {
    expect(copy.added(), 'connections this copy keeps open after mounting').toEqual(['home']);
  } finally { copy.unmount(); copy.host.remove(); }
});

test('switching the list moves the connection', async () => {
  const copy = await mount();
  try {
    await user.click(buttonByText(copy.host, L.work));
    expect(copy.added(), 'connections after switching to “work”').toEqual(['work']);
    await user.click(buttonByText(copy.host, L.home));
    expect(copy.added(), 'connections after switching back to “home”').toEqual(['home']);
  } finally { copy.unmount(); copy.host.remove(); }
});

test('turning sync off closes the connection', async () => {
  const copy = await mount();
  try {
    await user.click(buttonByText(copy.host, L.turnOff));
    expect(copy.added(), 'connections after turning sync off').toEqual([]);
  } finally { copy.unmount(); copy.host.remove(); }
});

test('turning sync on again opens one connection', async () => {
  const copy = await mount();
  try {
    await user.click(buttonByText(copy.host, L.turnOff));
    await user.click(buttonByText(copy.host, L.turnOn));
    expect(copy.added(), 'connections after turning sync off and on').toEqual(['home']);
  } finally { copy.unmount(); copy.host.remove(); }
});
