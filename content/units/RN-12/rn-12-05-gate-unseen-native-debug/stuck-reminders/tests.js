import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createNotifications } from './notifySim.js';
import { ReminderPanel } from './ReminderPanel.jsx';
import { createAppState } from './sim.js';

const due = [
  { id: 't-01', title: L.t1 },
  { id: 't-02', title: L.t2 },
];

// A fresh panel on a fresh simulated phone.
function launch(options) {
  const appState = createAppState();
  const notifications = createNotifications(options);
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  flushSync(() => root.render(createElement(ReminderPanel, { due, notifications, appState })));
  return {
    appState,
    notifications,
    text: () => box.textContent,
    button: (label) => [...box.querySelectorAll('[role="button"]')].find((el) => el.textContent.trim() === label),
    unmount() {
      flushSync(() => root.unmount());
      box.remove();
    },
  };
}

const ON = () => `${L.remindersOn}: ${due.length}`;
const settle200 = () => sleep(200);

async function backAfter(phone, settingsChange) {
  phone.appState.leave();
  settingsChange();
  phone.appState.comeBack();
  await settle200();
}

test('with the permission allowed the panel turns reminders on', async () => {
  const phone = launch({ granted: true });
  try {
    await settle200();
    expect(phone.text(), 'text of the panel').toContain(ON());
    expect(phone.notifications.scheduledCount(), 'scheduled reminders').toBe(due.length);
  } finally {
    phone.unmount();
  }
});

test('after a revoke in the background a return shows reminders off and a way to the settings', async () => {
  const phone = launch({ granted: true });
  try {
    await settle200();
    await backAfter(phone, () => phone.notifications.revoke());
    expect(phone.text(), 'text of the panel after the return').toContain(L.remindersOff);
    const button = phone.button(L.openSettings);
    expect(Boolean(button), `a button "${L.openSettings}"`).toBe(true);
    await user.click(button);
    expect(phone.notifications.settingsOpened(), 'times the settings were opened').toBe(1);
  } finally {
    phone.unmount();
  }
});

test('a denial at launch shows reminders off, not a spinner', async () => {
  const phone = launch({ granted: false, answer: 'deny' });
  try {
    await settle200();
    expect(phone.text(), 'text of the panel after the denial').toContain(L.remindersOff);
    expect(Boolean(phone.button(L.openSettings)), `a button "${L.openSettings}"`).toBe(true);
  } finally {
    phone.unmount();
  }
});

test('a failed scheduling shows reminders off, not a spinner', async () => {
  const phone = launch({ granted: true, failScheduling: true });
  try {
    await settle200();
    expect(phone.text(), 'text of the panel when scheduling fails').toContain(L.remindersOff);
  } finally {
    phone.unmount();
  }
});

test('allowing again in the settings turns reminders back on after a return', async () => {
  const phone = launch({ granted: true });
  try {
    await settle200();
    await backAfter(phone, () => phone.notifications.revoke());
    await backAfter(phone, () => phone.notifications.allow());
    expect(phone.text(), 'text of the panel after allowing again').toContain(ON());
  } finally {
    phone.unmount();
  }
});

test('the panel leaves no AppState listener behind when it unmounts', async () => {
  const phone = launch({ granted: true });
  await settle200();
  phone.unmount();
  expect(phone.appState.listenerCount(), 'AppState listeners after the panel unmounted').toBe(0);
});
