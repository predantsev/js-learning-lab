import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { recordsReducer } from './recordsState';
import { RecordsProvider, useRecordsContext } from './RecordsContext';

const HABITS = [{ id: 'h-09', name: L.walk, active: true }];
const reduce = (state, action) => {
  expect(typeof recordsReducer, 'type of recordsReducer').toBe('function');
  return recordsReducer(state, action);
};
const STATES = {
  idle: () => ({ status: 'idle' }),
  loading: () => ({ status: 'loading' }),
  success: () => ({ status: 'success', habits: HABITS }),
  failure: () => ({ status: 'failure', message: L.serverDown }),
};
const ACTIONS = {
  started: { type: 'started' },
  loaded: { type: 'loaded', habits: HABITS },
  failed: { type: 'failed', message: L.serverDown },
  retried: { type: 'retried' },
};

// Mounts an element in its own root and records errors React reports.
async function mount(element, ready) {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) });
  root.render(element);
  await waitFor(() => ready(host) || errors.length > 0);
  await settle();
  return { host, errors, finish: () => { root.unmount(); host.remove(); } };
}

test('started moves idle and success to loading', () => {
  expect(reduce(STATES.idle(), ACTIONS.started), 'idle + started').toEqual({ status: 'loading' });
  expect(reduce(STATES.success(), ACTIONS.started), 'success + started').toEqual({ status: 'loading' });
});

test('loaded and failed finish a loading request', () => {
  expect(reduce(STATES.loading(), ACTIONS.loaded), 'loading + loaded').toEqual({ status: 'success', habits: HABITS });
  expect(reduce(STATES.loading(), ACTIONS.failed), 'loading + failed').toEqual({ status: 'failure', message: L.serverDown });
});

test('retried moves failure to loading', () => {
  expect(reduce(STATES.failure(), ACTIONS.retried), 'failure + retried').toEqual({ status: 'loading' });
});

test('every other pair returns the same state object', () => {
  const allowed = new Set(['idle+started', 'success+started', 'loading+loaded', 'loading+failed', 'failure+retried']);
  for (const [stateName, makeState] of Object.entries(STATES)) {
    for (const [actionName, action] of Object.entries(ACTIONS)) {
      if (allowed.has(`${stateName}+${actionName}`)) continue;
      const state = makeState();
      expect(reduce(state, action) === state, `${stateName} + ${actionName} returns the same state`).toBe(true);
    }
  }
});

test('outside a provider the hook throws an error that names it', async () => {
  function Probe() { useRecordsContext(); return createElement('p', null, 'probe'); }
  const copy = await mount(createElement(Probe), (host) => host.querySelector('p') !== null);
  try {
    expect(copy.errors.length, 'errors React reported for a component outside the provider').toBe(1);
    expect(copy.errors[0].message, 'the error message').toContain('useRecordsContext');
  } finally { copy.finish(); }
});

test('inside the provider the hook gives the idle state and a dispatch function', async () => {
  let seen = null;
  function Probe() { seen = useRecordsContext(); return createElement('p', null, 'probe'); }
  const copy = await mount(createElement(RecordsProvider, null, createElement(Probe)), (host) => host.querySelector('p') !== null);
  try {
    expect(copy.errors.map((error) => error.message), 'errors React reported').toEqual([]);
    expect(seen?.state, 'state on the first render').toEqual({ status: 'idle' });
    expect(typeof seen?.dispatch, 'type of dispatch').toBe('function');
  } finally { copy.finish(); }
});

test('the page loads, fails and retries through one shared state', async () => {
  const copy = await mount(createElement(App), (host) => host.querySelector('button') !== null);
  const { host } = copy;
  try {
    const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
    const count = () => host.querySelector('[data-part="count"]').textContent;
    await user.click(button(L.loadFailing));
    await waitFor(() => host.querySelector('[role="alert"]') !== null);
    expect(host.querySelector('[role="alert"]'), 'the alert after a failed load').toHaveTextContent(L.serverDown);
    await user.click(button(L.retry));
    await waitFor(() => host.querySelectorAll('li').length > 0);
    expect([...host.querySelectorAll('li')].map((li) => li.textContent), 'habits after Try again').toEqual([L.exercise, L.water, L.words]);
    expect(count(), 'the count in the header, which reads the same context').toContain('3');
  } finally { copy.finish(); }
});
