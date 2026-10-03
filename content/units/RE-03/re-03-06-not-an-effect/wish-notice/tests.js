import { createElement, Profiler } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy inside a Profiler that counts React's commits.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const stats = { commits: 0 };
  createRoot(host).render(createElement(Profiler, { id: 'wish-form', onRender: () => { stats.commits += 1; } }, createElement(App)));
  await waitFor(() => host.querySelector('input') !== null);
  await settle();
  return { host, stats };
}
const names = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
async function addWish(host, text) {
  const input = host.querySelector('input');
  await user.fill(input, text);
  await user.submit(host.querySelector('form'));
}

test('there is no notice before anything is added', async () => {
  const { host } = await mount();
  expect(host.querySelector('[role="status"]').textContent, 'notice on the first display').toBe('');
});

test('adding a wish puts it into the list and clears the field', async () => {
  const { host } = await mount();
  await addWish(host, L.bike);
  expect(names(host), 'names in the list').toEqual([L.lamp, L.mug, L.bike]);
  expect(host.querySelector('input'), 'the name field').toHaveValue('');
});

test('the notice names the wish that was just added', async () => {
  const { host } = await mount();
  await addWish(host, L.bike);
  expect(host.querySelector('[role="status"]').textContent, 'notice after adding').toBe(`${L.addedPrefix} ${L.bike}`);
  await addWish(host, L.tickets);
  expect(host.querySelector('[role="status"]').textContent, 'notice after adding a second wish').toBe(`${L.addedPrefix} ${L.tickets}`);
});

test('an empty name adds nothing', async () => {
  const { host } = await mount();
  await addWish(host, '   ');
  expect(names(host), 'names after submitting spaces').toEqual([L.lamp, L.mug]);
  expect(host.querySelector('[role="status"]').textContent, 'notice after submitting spaces').toBe('');
});

test('one submit causes exactly one commit', async () => {
  const { host, stats } = await mount();
  await user.fill(host.querySelector('input'), L.bike);
  stats.commits = 0;
  await user.submit(host.querySelector('form'));
  await settle();
  expect(stats.commits, 'commits caused by one submit').toBe(1);
});
