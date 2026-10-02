import { dueCount as after } from './after.js';
import { review } from './review.js';

// The correct count: pending tasks with a due date on or before today.
const correct = (tasks, today) => tasks.filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today).length;
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const tasks = () => (Array.isArray(review.failingTasks) ? review.failingTasks : []);

test('today is a YYYY-MM-DD date', () => {
  expect(isDate(review.today), 'today').toBe(true);
});

test('failingTasks is a non-empty list of tasks', () => {
  expect(Array.isArray(review.failingTasks), 'failingTasks is an array').toBe(true);
  expect(tasks().length, 'number of failingTasks').toBeGreaterThan(0);
  for (const task of tasks()) {
    expect(typeof task.done, 'done of a task').toBe('boolean');
    expect(task.dueDate === null || isDate(task.dueDate), 'dueDate of a task is null or YYYY-MM-DD').toBe(true);
  }
});

test('expected is the correct count', () => {
  expect(review.expected, 'expected').toBe(correct(tasks(), review.today));
});

test('the new dueCount really gives a wrong count', () => {
  expect(tasks().length, 'number of failingTasks').toBeGreaterThan(0);
  expect(after(tasks(), review.today) === correct(tasks(), review.today), 'the new dueCount is correct for this case').toBe(false);
});

test('the defect comment names the failing case', () => {
  const comment = text(review.defectComment);
  const dates = [review.today, ...tasks().map((task) => task.dueDate)].filter(isDate);
  expect(dates.some((date) => comment.includes(date)), 'defectComment mentions today or a due date of failingTasks').toBe(true);
});

test('the question is a real question', () => {
  const question = text(review.question);
  expect(question.length, 'length of question').toBeGreaterThanOrEqual(10);
  expect(question.endsWith('?'), 'question ends with ?').toBe(true);
});

test('the decision is request-changes', () => {
  expect(review.decision).toBe('request-changes');
});

test('the reason explains the decision', () => {
  expect(text(review.reason).length, 'length of reason').toBeGreaterThanOrEqual(15);
});
