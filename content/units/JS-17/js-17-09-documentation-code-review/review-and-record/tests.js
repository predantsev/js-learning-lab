import * as written from './review.js';

const AFTER = ['domain/planner.js', 'ui/page.js', 'storage/planner.js', 'app.js'];
const lineOf = (file, line) => (files[`after/${file}`] ?? '').split('\n')[line - 1];
const text = (value, min = 1) => typeof value === 'string' && value.trim().length >= min;
const decision = () => {
  expect(typeof written.decision, 'type of the decision export of review.js').toBe('object');
  return written.decision;
};
const comments = () => {
  expect(Array.isArray(written.comments), 'the comments export of review.js is an array').toBe(true);
  return written.comments;
};
const pointsAt = (comment, test) => {
  const line = lineOf(comment.file, comment.line);
  return line !== undefined && test(line);
};

test('the decision record has context, decision, a rejected option and consequences', () => {
  for (const field of ['context', 'decision', 'consequences']) {
    expect(text(decision()[field], 10), `${field} has at least 10 characters`).toBe(true);
  }
  expect(text(decision().rejected?.option, 3) && text(decision().rejected?.reason, 10), 'rejected names an option and a reason').toBe(true);
});

test('the decision record gives numbers as evidence', () => {
  expect(text(decision().evidence, 10), 'evidence has at least 10 characters').toBe(true);
  expect(/\d/.test(decision().evidence), 'evidence contains a number').toBe(true);
});

test('there are at least three comments, each pointing at a real line', () => {
  expect(comments().length, 'number of comments').toBeGreaterThanOrEqual(3);
  for (const [i, comment] of comments().entries()) {
    expect(AFTER.includes(comment.file), `comment ${i + 1}: file is one of ${AFTER.join(', ')}`).toBe(true);
    expect(Number.isInteger(comment.line) && lineOf(comment.file, comment.line) !== undefined, `comment ${i + 1}: line ${comment.line} exists in ${comment.file}`).toBe(true);
  }
});

test('every comment states the problem, the evidence and a suggestion', () => {
  for (const [i, comment] of comments().entries()) {
    for (const field of ['problem', 'evidence', 'suggestion']) {
      expect(text(comment[field], 10), `comment ${i + 1}: ${field} has at least 10 characters`).toBe(true);
    }
    expect(typeof comment.blocking, `comment ${i + 1}: blocking is true or false`).toBe('boolean');
  }
});

test('a blocking comment points at the innerHTML line with the task title', () => {
  expect(comments().some((comment) => comment.blocking === true && comment.file === 'ui/page.js' && pointsAt(comment, (line) => line.includes('innerHTML') && line.includes('task.title'))), 'a blocking comment on the line row.innerHTML = …${task.title}…').toBe(true);
});

test('a blocking comment points at the done button that has no name', () => {
  expect(comments().some((comment) => comment.blocking === true && comment.file === 'ui/page.js' && pointsAt(comment, (line) => line.includes('done') && (line.includes('createElement("button")') || line.includes('CHECK_ICON')))), 'a blocking comment on the line that creates the done button or puts the icon into it').toBe(true);
});

test('the formatting-only change does not block the merge', () => {
  expect(comments().filter((comment) => comment.blocking === true && comment.file === 'storage/planner.js').length, 'blocking comments on storage/planner.js').toBe(0);
});

test('the README explains how to run the project', () => {
  const readme = files['README.md'] ?? '';
  expect((readme.match(/^## /gm) ?? []).length, 'number of "## " section headings in README.md').toBeGreaterThanOrEqual(2);
  expect(/```[^\n]*\n[ \t]*\S[^\n]*\n[\s\S]*?```/.test(readme), 'README.md has a code block with at least one command').toBe(true);
});

test('the README names every module', () => {
  const readme = files['README.md'] ?? '';
  const missing = AFTER.filter((file) => !readme.includes(file));
  expect(missing, 'module files not mentioned in README.md').toEqual([]);
});
