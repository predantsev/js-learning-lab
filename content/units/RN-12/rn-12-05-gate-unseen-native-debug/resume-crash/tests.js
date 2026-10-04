import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { diagnosis } from './diagnosis.js';
import { PlannerScreen } from './PlannerScreen.jsx';
import { createAppState, createDeviceClock } from './sim.js';

// A fresh screen on a fresh simulated phone, so every check starts on its own launch day.
function launch(day) {
  const appState = createAppState();
  const clock = createDeviceClock(day);
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  flushSync(() => root.render(createElement(PlannerScreen, { appState, clock })));
  return {
    appState,
    clock,
    text: () => box.textContent,
    unmount() {
      flushSync(() => root.unmount());
      box.remove();
    },
  };
}

const heading = (date, count) => `${L.dueOn} ${date}: ${count}`;

test('the screen shows the tasks due on the launch day', async () => {
  const phone = launch('2026-03-01');
  try {
    await waitFor(() => phone.text().includes(heading('01.03.2026', 1)));
    expect(phone.text(), 'text of the screen on 2026-03-01').toContain(heading('01.03.2026', 1));
    expect(phone.text(), 'text of the screen on 2026-03-01').toContain(L.t2);
  } finally {
    phone.unmount();
  }
});

test('coming back to the app does not throw', async () => {
  const phone = launch('2026-03-01');
  try {
    await waitFor(() => phone.text().includes(heading('01.03.2026', 1)));
    phone.appState.leave();
    let thrown = null;
    try {
      phone.appState.comeBack();
    } catch (error) {
      thrown = `${error.name}: ${error.message}`;
    }
    await sleep(50);
    expect(thrown, 'the error thrown while the app came back').toBeNull();
  } finally {
    phone.unmount();
  }
});

test('after midnight in the background a return shows the tasks due on the new day', async () => {
  const phone = launch('2026-03-01');
  try {
    await waitFor(() => phone.text().includes(heading('01.03.2026', 1)));
    phone.appState.leave();
    phone.clock.setDay('2026-03-02');
    try {
      phone.appState.comeBack();
    } catch {
      // the previous check reports the error itself
    }
    await sleep(100);
    expect(phone.text(), 'text of the screen after the return on 2026-03-02').toContain(heading('02.03.2026', 2));
  } finally {
    phone.unmount();
  }
});

test('the screen leaves no AppState listener behind when it unmounts', async () => {
  const phone = launch('2026-03-01');
  await waitFor(() => phone.text().includes(heading('01.03.2026', 1)));
  phone.unmount();
  expect(phone.appState.listenerCount(), 'AppState listeners after the screen unmounted').toBe(0);
});

test('the diagnosis names the first real error of the build log', () => {
  expect(diagnosis?.buildLine, 'diagnosis.buildLine').toBe(9);
});

test('the diagnosis names the cause of the bundling failure', () => {
  expect(diagnosis?.buildCause, 'diagnosis.buildCause').toBe('removed-export');
});

test('the diagnosis names the first line of the crash error', () => {
  expect(diagnosis?.crashLine, 'diagnosis.crashLine').toBe(7);
});

test('the diagnosis names the cause of the crash', () => {
  expect(diagnosis?.crashCause, 'diagnosis.crashCause').toBe('promise-used-as-value');
});
