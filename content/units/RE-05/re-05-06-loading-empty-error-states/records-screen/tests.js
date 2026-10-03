import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { RecordsScreen } from './RecordsScreen';
import { setNextOutcome } from './tasksApi';

// Every check mounts its own screen; the fake server answers after 300 ms.
async function mount(outcome) {
  setNextOutcome(outcome);
  const onCreate = spy();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(RecordsScreen, { onCreate }));
  await waitFor(() => host.childElementCount > 0);
  return {
    host,
    onCreate,
    status: () => host.querySelector('[role="status"]'),
    statusText: () => host.querySelector('[role="status"]')?.textContent.trim() ?? '(no role="status" element)',
    items: () => [...host.querySelectorAll('li')].map((li) => li.textContent),
    button: (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text),
    buttons: () => host.querySelectorAll('button').length,
    finish: () => { root.unmount(); host.remove(); setNextOutcome('ok'); },
  };
}
const settled = (copy) => waitFor(() => copy.statusText() !== L.loading, { timeout: 2000 }).catch(() => {});

test('while loading only the loading status is shown', async () => {
  const copy = await mount('ok');
  try {
    expect(copy.statusText(), 'status text right after mounting').toBe(L.loading);
    expect(copy.items(), 'list items while loading').toEqual([]);
    expect(copy.buttons(), 'buttons while loading').toBe(0);
  } finally { copy.finish(); }
});

test('a successful load shows the count and the tasks', async () => {
  const copy = await mount('ok');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text after loading').toBe(`${L.loaded} 3`);
    expect(copy.items(), 'list items').toEqual([L.plants, L.library, L.dentist]);
  } finally { copy.finish(); }
});

test('an empty load shows the empty status and a create action', async () => {
  const copy = await mount('empty');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text for an empty list').toBe(L.noTasks);
    expect(copy.items(), 'list items').toEqual([]);
    const create = copy.button(L.createFirst);
    expect(create, `a button "${L.createFirst}"`).toBeDefined();
    await user.click(create);
    expect(copy.onCreate, 'onCreate').toHaveBeenCalledTimes(1);
  } finally { copy.finish(); }
});

test('a failed load shows its own message and a retry that loads again', async () => {
  const copy = await mount('fail');
  try {
    await settled(copy);
    expect(copy.statusText(), 'status text after a failure').toBe(L.loadFailed);
    expect(copy.button(L.createFirst), 'a create button on the error state').toBeUndefined();
    const retry = copy.button(L.retry);
    expect(retry, `a button "${L.retry}"`).toBeDefined();
    setNextOutcome('ok');
    await user.click(retry);
    await settle();
    expect(copy.statusText(), 'status text right after Retry').toBe(L.loading);
    await settled(copy);
    expect(copy.items(), 'list items after a successful retry').toEqual([L.plants, L.library, L.dentist]);
  } finally { copy.finish(); }
});

test('the status element stays the same element in every state', async () => {
  const copy = await mount('fail');
  try {
    const first = copy.status();
    expect(first, 'a role="status" element while loading').not.toBeNull();
    await settled(copy);
    expect(copy.status() === first, 'the role="status" element after the failure is the one from loading').toBe(true);
    setNextOutcome('ok');
    await user.click(copy.button(L.retry));
    await settled(copy);
    expect(copy.status() === first, 'the role="status" element after the retry is still the same').toBe(true);
  } finally { copy.finish(); }
});
