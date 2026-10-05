import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import ModuleLoadFallback from './ModuleLoadFallback';

const chunkError = () => new TypeError('Failed to fetch dynamically imported module: http://localhost:4173/assets/DueToday-C7tWm2aQ.js');
const codeError = () => new TypeError("Cannot read properties of undefined (reading 'map')");
const textOf = (node) => node.textContent.replace(/\s+/g, ' ').trim();

// Renders ModuleLoadFallback in a fresh container; returns the container and a cleanup.
function show(error, onReload) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(createElement(ModuleLoadFallback, { error, onReload })));
  return { container, done: () => { root.unmount(); container.remove(); } };
}
const reloadButton = (container) => [...container.querySelectorAll('button')].find((button) => textOf(button) === L.reloadPage) ?? null;

test('a failed module load shows the new-version alert', () => {
  const { container, done } = show(chunkError(), spy());
  try {
    const alert = container.querySelector('[role="alert"]');
    expect(alert !== null, 'an element with role="alert"').toBe(true);
    expect(textOf(alert), 'text of the alert').toContain(L.newVersion);
  } finally {
    done();
  }
});

test('the reload button calls onReload once, only when pressed', async () => {
  const onReload = spy();
  const { container, done } = show(chunkError(), onReload);
  try {
    expect(onReload.calls.length, 'calls of onReload before the press').toBe(0);
    const button = reloadButton(container);
    expect(button !== null, `a button "${L.reloadPage}"`).toBe(true);
    await user.click(button);
    expect(onReload.calls.length, 'calls of onReload after one press').toBe(1);
  } finally {
    done();
  }
});

test('another error shows a general alert without a reload button', () => {
  const onReload = spy();
  const { container, done } = show(codeError(), onReload);
  try {
    const alert = container.querySelector('[role="alert"]');
    expect(alert !== null, 'an element with role="alert"').toBe(true);
    expect(textOf(alert), 'text of the alert').toContain(L.somethingWrong);
    expect(reloadButton(container), `the "${L.reloadPage}" button for an ordinary error`).toBeNull();
    expect(onReload.calls.length, 'calls of onReload').toBe(0);
  } finally {
    done();
  }
});
