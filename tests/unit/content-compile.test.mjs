// Lesson compilation and static checks on small in-memory lessons (scripts/content/lib.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileLesson, createMarkdown, staticIssuesForLesson } from '../../scripts/content/lib.mjs';

const md = createMarkdown(new Map([['closure', { id: 'closure', term: 'closure' }]]));
const ctx = { md, glossary: new Map([['closure', { id: 'closure', term: 'closure' }]]), syllabus: new Map(), lessonOrder: null, competencies: { families: null }, release: false };
const pair = (uk, en = uk) => ({ uk, en });
const lessonWith = (blocks, assets = {}) => ({ source: { id: 'js-01-09-sample', unit: 'JS-01', title: pair('Т', 'T'), kind: 'review', minutes: 10, contentVersion: 1, objectives: [pair('о', 'o')], purpose: pair('п', 'p'), subskills: [], blocks }, assets, dir: '/nonexistent' });
const compiledBlock = async (block, assets) => (await compileLesson(lessonWith([block], assets), ctx)).lesson.blocks[0];
const placeholderIssues = (lesson) => staticIssuesForLesson(lesson, ctx).filter((i) => /placeholder|strings/.test(i.message)).map((i) => i.message);

const exercise = {
  id: 'cart',
  kind: 'exercise',
  mode: 'guided',
  runtime: 'browser-js',
  dir: 'cart',
  entry: 'index.js',
  strings: { lamp: pair('Лампа', 'Lamp'), total: pair('Разом', 'Total') },
  title: pair('Кошик', 'Cart'),
  instructions: pair('Виведи «%%total%%» для %%lamp%%.', 'Print "%%total%%" for %%lamp%%.'),
  testTitles: { 'prints the total': pair('Друкує «%%total%%»', 'Prints `%%total%%`') },
  hints: { nudge: pair('Знайди %%lamp%%.', 'Find %%lamp%%.'), explanation: pair('Пояснення %%total%%.', 'Explanation %%total%%.') },
  solutionNote: pair('Рядок %%total%%.', 'Line %%total%%.'),
  feedback: [{ when: { test: 'prints the total' }, message: pair('Очікуємо %%total%%.', 'Expected %%total%%.') }],
};
const exerciseAssets = { cart: { starter: { 'index.js': 'console.log("%%lamp%%");\n' }, solution: {}, tests: 'test("prints the total", () => {});', variants: { wrong: {} } } };

test('%%key%% placeholders are resolved in every prose field of an exercise, per language', async () => {
  const b = await compiledBlock(exercise, exerciseAssets);
  assert.match(b.instructions.uk, /Виведи «Разом» для Лампа\./);
  assert.match(b.instructions.en, /Print &quot;Total&quot; for Lamp\./);
  assert.equal(b.testTitles['prints the total'].en, 'Prints <code>Total</code>');
  assert.equal(b.testTitles['prints the total'].uk, 'Друкує «Разом»');
  assert.match(b.hints.nudge.uk, /Знайди Лампа/);
  assert.match(b.hints.explanation.en, /Explanation Total/);
  assert.match(b.solutionNote.en, /Line Total/);
  assert.match(b.feedback[0].message.uk, /Очікуємо Разом/);
  const { files: _f, tests: _t, strings: _s, ...prose } = b;
  assert.doesNotMatch(JSON.stringify(prose), /%%(total|lamp)%%/);
  // The code files keep their placeholders: they are localized when the learner's language is known.
  assert.equal(b.files['index.js'], 'console.log("%%lamp%%");\n');
});

test('%%key%% placeholders are resolved in a prediction prompt, its options and explanation, and in example prose', async () => {
  const prediction = await compiledBlock({
    id: 'guess',
    kind: 'prediction',
    strings: { hi: pair('Привіт', 'Hello') },
    prompt: pair('Що виведе %%hi%%?', 'What does %%hi%% print?'),
    code: 'console.log("%%hi%%");',
    answer: { type: 'choice', options: [{ id: 'a', text: pair('%%hi%%') , why: pair('Бо %%hi%%', 'Because %%hi%%') }, { id: 'b', code: '"%%hi%%"' }], correct: ['a'] },
    explanation: pair('Друкує %%hi%%.', 'Prints %%hi%%.'),
  });
  assert.match(prediction.prompt.en, /What does Hello print\?/);
  assert.equal(prediction.answer.options[0].text.uk, 'Привіт');
  assert.equal(prediction.answer.options[0].why.en, 'Because Hello');
  assert.deepEqual(prediction.answer.options[1].code, { uk: '"Привіт"', en: '"Hello"' });
  assert.match(prediction.explanation.uk, /Друкує Привіт/);
  const example = await compiledBlock({ id: 'demo', kind: 'example', runtime: 'browser-js', dir: 'demo', entry: 'index.js', strings: { hi: pair('Привіт', 'Hello') }, title: pair('Т', 'T'), body: pair('Тіло %%hi%%', 'Body %%hi%%'), tryIt: pair('Зміни %%hi%%', 'Change %%hi%%') }, { demo: { files: { 'index.js': '' } } });
  assert.match(example.body.en, /Body Hello/);
  assert.match(example.tryIt.uk, /Зміни Привіт/);
});

test('a placeholder in prose without an entry in strings is reported, like one in code', () => {
  const block = { ...exercise, strings: { lamp: pair('Лампа', 'Lamp') } };
  assert.deepEqual(placeholderIssues(lessonWith([block], exerciseAssets)), ['placeholder %%total%% has no entry in strings']);
  const { strings: _s, ...noStrings } = block;
  const prose = { ...noStrings, instructions: pair('Для %%lamp%%', 'For %%lamp%%') };
  assert.deepEqual(placeholderIssues(lessonWith([prose], { cart: { ...exerciseAssets.cart, starter: { 'index.js': '' } } })).sort(), ['placeholder %%lamp%% has no entry in strings', 'placeholder %%total%% has no entry in strings']);
});

test('review questions share the review block strings; strings on a question are rejected with that advice', () => {
  const review = (item, strings) => ({ id: 'recall', kind: 'review', title: pair('П', 'R'), ...(strings ? { strings } : {}), items: [{ id: 'q', from: 'js-01-01-code-runs', prompt: pair('Що %%hi%%?', 'What %%hi%%?'), answer: { type: 'text', accept: ['1'] }, explanation: pair('е', 'e'), ...item }] });
  assert.deepEqual(placeholderIssues(lessonWith([review({}, { hi: pair('п', 'h') })])), []);
  const misplaced = placeholderIssues(lessonWith([review({ strings: { hi: pair('п', 'h') } })]));
  assert.ok(misplaced.includes('put strings on the review block: its questions share one table'), misplaced.join('\n'));
  assert.ok(misplaced.some((m) => /placeholder %%hi%% has no entry in strings \(the review block's strings/.test(m)), misplaced.join('\n'));
});
