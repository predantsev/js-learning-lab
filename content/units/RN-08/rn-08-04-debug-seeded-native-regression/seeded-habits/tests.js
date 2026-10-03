import { TODAY, WEEK, weeklyRate } from './habits.js';
import { restoreSnapshot } from './snapshot.js';

const repo = () => scope.app.repo;
const stack = () => scope.app.stack;

// A fresh launch of the app on the same simulated disk, waiting until the habits are loaded.
async function relaunch() {
  scope.app.restart();
  await waitFor(() => repo().getState().status !== 'loading');
  await settle();
}

async function go(name, params) {
  stack().navigate(name, params);
  await settle();
}

async function back() {
  stack().headerBack();
  await settle();
}

test('after the update the list shows the habits saved by 1.x', async () => {
  await waitFor(() => repo().getState().status !== 'loading');
  await settle();
  expect(screen.text(), 'text of the list after the first launch of 2.0.0').toContain(L.exercise);
  expect(screen.text(), 'text of the list after the first launch of 2.0.0').toContain(L.water);
});

test('a 1.x snapshot restores every habit as a daily habit', () => {
  const old = [
    { id: 'h-01', name: L.exercise, active: true, completions: ['2026-02-27'] },
    { id: 'h-05', name: L.words, active: false, completions: [] },
  ];
  const result = restoreSnapshot(JSON.stringify({ schemaVersion: 1, records: old }));
  expect(result?.ok, 'ok of restoreSnapshot for a v1 snapshot').toBe(true);
  expect(result.records, 'records of restoreSnapshot for a v1 snapshot').toEqual(old.map((habit) => ({ ...habit, frequency: 'daily' })));
});

test('a 2.0.0 snapshot restores unchanged', () => {
  const current = [{ id: 'h-04', name: L.tidy, active: true, frequency: 'weekly', completions: ['2026-02-22', '2026-03-01'] }];
  const result = restoreSnapshot(JSON.stringify({ schemaVersion: 2, records: current }));
  expect(result?.ok, 'ok of restoreSnapshot for a v2 snapshot').toBe(true);
  expect(result.records, 'records of restoreSnapshot for a v2 snapshot').toEqual(current);
});

test('a snapshot this app cannot read is a failure, not an empty list', () => {
  const newer = JSON.stringify({ schemaVersion: 3, records: [{ id: 'h-01', name: L.exercise }] });
  for (const [label, raw] of [['a v3 snapshot', newer], ['cut-off text', '{"schemaVersion":1,"records":['], ['text without records', '"habits"']]) {
    expect(restoreSnapshot(raw)?.ok, `ok of restoreSnapshot for ${label}`).toBe(false);
  }
});

test('a mark made on the list survives a restart', async () => {
  await relaunch();
  const markedToday = () => repo().getHabits().find((habit) => habit.id === 'h-02')?.completions.includes(TODAY);
  const before = markedToday();
  expect(before, 'h-02 marked today after the launch (undefined: h-02 is missing)').toBeDefined();
  await user.click(screen.byRole('checkbox', { name: new RegExp(L.reading) }));
  await settle();
  await relaunch();
  expect(markedToday(), 'h-02 marked today after the tap and a restart').toBe(!before);
});

test('after leaving the week screen, it no longer listens to changes', async () => {
  await relaunch();
  const listOnly = repo().listenerCount(); // the list screen's own subscription
  await go('Week');
  await back();
  expect(repo().listenerCount(), 'repo listeners after Week was opened and left').toBe(listOnly);
});

test('while another screen covers the week screen, it does not listen', async () => {
  await relaunch();
  const listOnly = repo().listenerCount();
  await go('Week');
  await go('Detail', { id: 'h-03' });
  // The detail screen subscribes once itself.
  expect(repo().listenerCount(), 'repo listeners while Detail covers Week').toBe(listOnly + 1);
});

test('after three visits the week screen listens once', async () => {
  await relaunch();
  const listOnly = repo().listenerCount();
  for (let visit = 0; visit < 3; visit += 1) {
    await go('Week');
    await back();
  }
  await go('Week');
  expect(repo().listenerCount(), 'repo listeners on the fourth visit to Week').toBe(listOnly + 1);
});

test('returning to the week screen shows the current rate', async () => {
  await relaunch();
  await go('Week');
  await go('Detail', { id: 'h-03' });
  const stale = weeklyRate(repo().getHabits(), WEEK);
  await repo().toggleToday('h-03');
  await settle();
  const current = weeklyRate(repo().getHabits(), WEEK);
  expect(current, 'the rate changed after the toggle').not.toBe(stale);
  await back();
  expect(screen.text(), 'text of the week screen after returning').toContain(`${L.weekRate} ${current}%`);
});
