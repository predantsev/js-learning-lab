import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { activeSubscriptions, setReduceMotion } from './motionSettings.js';
import * as hook from './useReducedMotion.js';

// Mounts a small component that uses the hook and prints its value as text.
function mountProbe() {
  expect(typeof hook.useReducedMotion, 'type of useReducedMotion').toBe('function');
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  function Probe() {
    return createElement('span', null, String(hook.useReducedMotion()));
  }
  root.render(createElement(Probe));
  return {
    text: () => container.textContent,
    rerender: (n) => root.render(createElement(Probe, { n })),
    unmount: () => { root.unmount(); container.remove(); },
  };
}

test('a component mounted while the setting is on gets true', async () => {
  setReduceMotion(true);
  const probe = mountProbe();
  try {
    await waitFor(() => probe.text() === 'true', { timeout: 1000 });
    expect(probe.text(), 'the hook value after mounting with the setting on').toBe('true');
  } finally {
    probe.unmount();
    setReduceMotion(false);
  }
});

test('the value follows changes of the setting while mounted', async () => {
  setReduceMotion(false);
  const probe = mountProbe();
  try {
    await sleep(50);
    setReduceMotion(true);
    await waitFor(() => probe.text() === 'true', { timeout: 1000 });
    expect(probe.text(), 'the hook value after the setting turned on').toBe('true');
    setReduceMotion(false);
    await waitFor(() => probe.text() === 'false', { timeout: 1000 });
    expect(probe.text(), 'the hook value after the setting turned off again').toBe('false');
  } finally {
    probe.unmount();
  }
});

test('unmounting removes the subscription', async () => {
  const before = activeSubscriptions();
  const probe = mountProbe();
  await sleep(50);
  probe.unmount();
  await sleep(20);
  expect(activeSubscriptions(), 'active subscriptions after mounting and unmounting one component').toBe(before);
});

test('one mounted component keeps one subscription however often it renders', async () => {
  const before = activeSubscriptions();
  const probe = mountProbe();
  try {
    for (let n = 1; n <= 5; n += 1) {
      probe.rerender(n);
      await sleep(10);
    }
    expect(activeSubscriptions() - before, 'extra active subscriptions after 6 renders of one component').toBe(1);
  } finally {
    probe.unmount();
  }
});
