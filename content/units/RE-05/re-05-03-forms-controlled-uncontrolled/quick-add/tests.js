import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Every check mounts its own copy of the form, so the checks do not share habits.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelector('form') !== null);
  const q = (selector) => host.querySelector(selector);
  return {
    host,
    q,
    items: () => [...host.querySelectorAll('li')].map((li) => li.textContent),
    finish: () => { root.unmount(); host.remove(); },
  };
}

test('submitting does not reload the page', async () => {
  const copy = await mount();
  try {
    await user.type(copy.q('#quick-name'), L.walk);
    const { prevented } = await user.submit(copy.q('form'));
    expect(prevented, 'the submit event was canceled with preventDefault()').toBe(true);
  } finally { copy.finish(); }
});

test('a valid habit is added with its trimmed name and chosen frequency', async () => {
  const copy = await mount();
  try {
    await user.type(copy.q('#quick-name'), `  ${L.walk}  `);
    await user.select(copy.q('#quick-frequency'), 'weekly');
    await user.submit(copy.q('form'));
    await settle();
    expect(copy.items(), 'the list after adding').toEqual([`${L.water} — ${L.daily}`, `${L.walk} — ${L.weekly}`]);
  } finally { copy.finish(); }
});

test('an empty name shows the required message and adds nothing', async () => {
  const copy = await mount();
  try {
    await user.type(copy.q('#quick-name'), '   ');
    await user.submit(copy.q('form'));
    await settle();
    expect(copy.q('#quick-error')?.textContent, 'error text').toBe(L.nameRequired);
    expect(copy.items(), 'the list').toHaveLength(1);
  } finally { copy.finish(); }
});

test('a name over 80 characters shows the too-long message and adds nothing', async () => {
  const copy = await mount();
  try {
    await user.type(copy.q('#quick-name'), 'a'.repeat(81));
    await user.submit(copy.q('form'));
    await settle();
    expect(copy.q('#quick-error')?.textContent, 'error text').toBe(L.nameTooLong);
    expect(copy.items(), 'the list').toHaveLength(1);
  } finally { copy.finish(); }
});

test('after a successful add the form is cleared and the error is gone', async () => {
  const copy = await mount();
  try {
    await user.submit(copy.q('form'));
    await settle();
    await user.type(copy.q('#quick-name'), L.walk);
    await user.select(copy.q('#quick-frequency'), 'weekly');
    await user.submit(copy.q('form'));
    await settle();
    expect(copy.q('#quick-name').value, 'name field after adding').toBe('');
    expect(copy.q('#quick-frequency').value, 'frequency after adding').toBe('daily');
    expect(copy.q('#quick-error'), 'error paragraph after a successful add').toBeNull();
  } finally { copy.finish(); }
});
