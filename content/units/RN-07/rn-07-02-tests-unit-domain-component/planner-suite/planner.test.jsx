import { test, expect, render, screen, userEvent } from './testing.js';
import { countDueTasks, validateTask } from './tasks.js';
import { TaskRow } from './TaskRow.jsx';
import { TaskScreen } from './TaskScreen.jsx';
import { createMockService, createTaskAdapter } from './mockService.js';
import { tasks } from './fixtures.js';

// 1. Unit: a pure domain function, no screen at all.
test('%%tUnit%%', () => {
  expect(countDueTasks(tasks, '2026-03-02')).toBe(2);
});

// 2. Typed domain, run-time half: stored JSON is checked by the validator.
//    (The type half — `priority: 'low' | 'normal' | 'high'` — is checked by tsc in a local project.)
test('%%tTyped%%', () => {
  const stored = JSON.parse('{"id":"t-07","title":"%%dentist%%","dueDate":null,"done":false,"priority":"urgent"}');
  expect(validateTask(stored).ok).toBe(false);
});

// 3. Component: render one row, press its toggle found by the accessible label, read the screen.
test('%%tComponent%%', async () => {
  const user = userEvent.setup();
  await render(<TaskRow task={tasks[0]} />);
  await user.press(screen.getByLabelText('%%markDone%%: %%water%%'));
  expect(screen.getByText('%%done%%')).toBeOnTheScreen();
});

// 4. Integration: the screen, the adapter and the (simulated) mock service together.
test('%%tIntegration%%', async () => {
  const service = createMockService(tasks);
  const user = userEvent.setup();
  await render(<TaskScreen adapter={createTaskAdapter(service)} />);
  await user.press(await screen.findByLabelText('%%markDone%%: %%water%%'));
  expect(await screen.findByText('%%saved%%')).toBeOnTheScreen();
  expect(service.records()[0].done).toBe(true);
});
