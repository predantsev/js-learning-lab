import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { HabitSummary, CompleteButton, RSC_LABELS } from './HabitCard';
import { HABIT } from './habit-data';

const squash = (text) => text.replace(/\s+/g, ' ').trim();

test('HabitSummary works as a plain function of props: no hooks, not async', () => {
  expect(typeof HabitSummary, 'type of HabitSummary').toBe('function');
  // A Server Component is called without any client state; hooks would throw here.
  let element;
  expect(() => {
    element = HabitSummary({ habit: HABIT });
  }, 'calling HabitSummary({ habit }) outside of React').not.toThrow();
  expect(element instanceof Promise, 'HabitSummary returns a promise (it is async)').toBe(false);
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => root.render(element));
  const text = squash(host.textContent);
  root.unmount();
  expect(text, 'the text HabitSummary renders').toContain(L.exercise);
  expect(text, 'the text HabitSummary renders').toContain(`${L.completions} 3`);
});

test('CompleteButton keeps its own state: a click switches it and back', async () => {
  expect(typeof CompleteButton, 'type of CompleteButton').toBe('function');
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(CompleteButton, { habitId: 'h-03', initiallyDone: true })));
    const button = host.querySelector('button');
    expect(button, 'the button CompleteButton renders').toHaveTextContent(L.doneToday);
    await user.click(button);
    await settle();
    expect(host.querySelector('button'), 'the button after one click').toHaveTextContent(L.markDone);
    await user.click(host.querySelector('button'));
    await settle();
    expect(host.querySelector('button'), 'the button after two clicks').toHaveTextContent(L.doneToday);
  } finally {
    root.unmount();
    host.remove();
  }
});

test('the card on the page shows the summary and a working button', async () => {
  await waitFor(() => screen.$('#root button') !== null, { timeout: 1000 }).catch(() => {});
  expect(squash(screen.$('#root').textContent), 'the page text').toContain(`${L.completions} 3`);
  const button = screen.byRole('button', { name: L.markDone });
  expect(button, `the "${L.markDone}" button`).toBeInTheDocument();
  await user.click(button);
  await settle();
  expect(screen.$('#root button'), 'the button after a click').toHaveTextContent(L.doneToday);
});

test('RSC_LABELS match the React documentation', () => {
  expect(RSC_LABELS, 'RSC_LABELS').toEqual({ serverComponents: 'stable', useClient: 'stable', taintUniqueValue: 'experimental' });
});
