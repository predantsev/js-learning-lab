import { createElement as h, useState } from 'react';
import { run } from './testing';
import { screenUnderTest } from './testUtils';
import { TaskScreen } from './TaskScreen';
import { useTasksApi } from './tasksApi';

// Broken copies of TaskScreen, each with one realistic defect in the failure path.
// They keep the same labels, buttons and texts, so a test written for the real screen runs unchanged.
function brokenScreen({ showsAlert = true, retryWorks = true, clearsAlert = true, addsOnRetry = true }) {
  return function BrokenTaskScreen() {
    const api = useTasksApi();
    const [title, setTitle] = useState('');
    const [tasks, setTasks] = useState([]);
    const [failed, setFailed] = useState(false);
    async function create(isRetry) {
      try {
        const task = await api.createTask(title.trim());
        if (!isRetry || addsOnRetry) setTasks((list) => [...list, task]);
        setTitle('');
        if (clearsAlert) setFailed(false);
      } catch {
        if (showsAlert) setFailed(true);
      }
    }
    return h('section', null,
      h('form', { onSubmit: (event) => { event.preventDefault(); if (title.trim() !== '') create(false); } },
        h('label', { htmlFor: 'new-task' }, L.newTask), ' ',
        h('input', { id: 'new-task', value: title, onChange: (event) => setTitle(event.target.value) }), ' ',
        h('button', { type: 'submit' }, L.add)),
      failed && h('div', { role: 'alert' }, h('p', null, L.createFailed), h('button', { onClick: () => { if (retryWorks) create(true); } }, L.retry)),
      h('ul', { 'aria-label': L.taskList }, tasks.map((task) => h('li', { key: task.id }, task.title))));
  };
}

async function suiteWith(Component) {
  screenUnderTest.Component = Component;
  try {
    return await run({ print: false });
  } finally {
    screenUnderTest.Component = TaskScreen;
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

async function expectCaught(Component) {
  const results = await suiteWith(Component);
  expect(results.length, 'number of tests in flow.test.tsx').toBeGreaterThan(1);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken screen').toBe(true);
}

test('your tests pass with the real screen', async () => {
  const results = await suiteWith(TaskScreen);
  expect(results.length, 'number of tests in flow.test.tsx').toBeGreaterThan(1);
  expect(failing(results), 'your tests that fail with the real screen').toEqual([]);
});

test('your tests pass again when the whole suite runs a second time', async () => {
  const results = await suiteWith(TaskScreen);
  expect(failing(results), 'your tests that fail on a repeated run').toEqual([]);
});

test('a test fails when a failed create shows no alert', async () => {
  await expectCaught(brokenScreen({ showsAlert: false }));
});

test('a test fails when Try again does nothing', async () => {
  await expectCaught(brokenScreen({ retryWorks: false }));
});

test('a test fails when the alert stays after a successful retry', async () => {
  await expectCaught(brokenScreen({ clearsAlert: false }));
});

test('a test fails when the retried task is not added to the list', async () => {
  await expectCaught(brokenScreen({ addsOnRetry: false }));
});
