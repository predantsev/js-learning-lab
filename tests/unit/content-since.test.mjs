// validate.mjs --since <ref>: which lessons, blocks and capstone steps changed (scripts/content/since.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectionFromChanges } from '../../scripts/content/since.mjs';

const lesson = (blocks) => ({ source: { blocks } });
const lessons = new Map([
  ['js-05-02-filter-find', lesson([{ id: 'try-filter', kind: 'example', dir: 'try-filter' }, { id: 'keep', kind: 'exercise', dir: 'keep-affordable' }, { id: 'flow', kind: 'visual', spec: {} }])],
  ['js-05-03-reduce', lesson([{ id: 'sum', kind: 'exercise', dir: 'sum' }])],
]);
const stepUnits = ['JS-01', 'JS-02', 'JS-03'];
const select = (files, contentRel = 'content') => selectionFromChanges(files, { contentRel, lessons, stepUnits });

test('a change inside an exercise or example folder selects only that block', () => {
  const s = select(['content/units/JS-05/js-05-02-filter-find/keep-affordable/wrong-off-by-one/index.js', 'content/units/JS-05/js-05-02-filter-find/keep-affordable/tests.js']);
  assert.deepEqual([...s.lessons.keys()], ['js-05-02-filter-find']);
  assert.deepEqual([...s.lessons.get('js-05-02-filter-find')], ['keep']);
  assert.deepEqual([...s.stepUnits], []);
});

test('lesson.yaml or a file outside the block folders selects the whole lesson', () => {
  assert.equal(select(['content/units/JS-05/js-05-02-filter-find/lesson.yaml', 'content/units/JS-05/js-05-02-filter-find/try-filter/index.js']).lessons.get('js-05-02-filter-find'), null);
  assert.equal(select(['content/units/JS-05/js-05-02-filter-find/try-filter/index.js', 'content/units/JS-05/js-05-02-filter-find/lesson.yaml']).lessons.get('js-05-02-filter-find'), null);
  assert.equal(select(['content/units/JS-05/js-05-02-filter-find/visuals/flow.js']).lessons.get('js-05-02-filter-find'), null);
});

test('a capstone step change also selects the next step (its state before); the start project selects every step', () => {
  assert.deepEqual([...select(['content/capstones/steps/JS-02/wishlist/task.yaml']).stepUnits].sort(), ['JS-02', 'JS-03']);
  assert.deepEqual([...select(['content/capstones/steps/JS-03/step.yaml']).stepUnits], ['JS-03']);
  assert.deepEqual([...select(['content/capstones/start/wishlist/index.html']).stepUnits].sort(), stepUnits);
  assert.deepEqual([...select(['content/capstones/README.md']).stepUnits], []);
});

test('glossary, syllabus and unknown lesson folders are only listed; platform files select everything', () => {
  const s = select(['content/glossary/JS-05.yaml', 'content/units/JS-05/js-05-99-deleted/lesson.yaml', 'README.md']);
  assert.equal(s.lessons.size, 0);
  assert.deepEqual(s.other, ['glossary/JS-05.yaml']);
  for (const file of ['sandbox/runtime.js', 'shared/exercise.js', 'server/app.mjs', 'scripts/content/lib.mjs', 'app/src/harness.ts']) {
    const all = select([file]);
    assert.equal(all.all, true, file);
    assert.match(all.reason, /platform files changed/);
  }
});

test('another content root (the e2e fixtures) is matched by its repository-relative path', () => {
  const s = select(['tests/fixtures/content/units/JS-05/js-05-03-reduce/sum/solution/index.js', 'content/units/JS-05/js-05-02-filter-find/lesson.yaml'], 'tests/fixtures/content');
  assert.deepEqual([...s.lessons.keys()], ['js-05-03-reduce']);
});
