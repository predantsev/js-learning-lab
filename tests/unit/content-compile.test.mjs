// Lesson compilation and static checks on small in-memory lessons (scripts/content/lib.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import * as visuals from '../../shared/visuals/index.js';
import { CONTENT_DIR, compileLesson, createMarkdown, gitIgnoredLessonFiles, glossaryLinkProblems, staticIssuesForLesson } from '../../scripts/content/lib.mjs';

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

test('a ReferenceError feedback rule in an exercise whose checks run a course runner is a warning, not an error', () => {
  const rules = [{ when: { error: 'ReferenceError' }, message: pair('Імпортуй назву.', 'Import the name.') }, { when: { error: 'TypeError' }, message: pair('т', 't') }];
  const withRunner = { ...exercise, feedback: rules };
  const runnerAssets = { cart: { ...exerciseAssets.cart, starter: { 'index.js': '', 'testing.js': 'export function run() {}', 'cart.test.js': '' }, tests: 'import * as testing from "./testing.js";\ntest("prints the total", async () => {});' } };
  const found = staticIssuesForLesson(lessonWith([withRunner], runnerAssets), ctx).filter((i) => i.level === 'warning');
  assert.equal(found.length, 1);
  assert.match(found[0].path, /block "cart"\.feedback\[0\]/);
  assert.match(found[0].message, /course runner \(testing\.js\) catches them/);
  // Without a course runner the rule is fine: a check that calls the learner's code throws it itself.
  assert.deepEqual(staticIssuesForLesson(lessonWith([withRunner], exerciseAssets), ctx).filter((i) => i.level === 'warning'), []);
});

test('raw HTML in Markdown prose is shown as text, never as markup (block, inline and text equivalents)', async () => {
  const sample = 'Look: <img src=x onerror="alert(1)"> and <b>bold</b>';
  for (const html of [md.block(sample), md.inline(sample), md.block(`<div>\n${sample}\n</div>`)]) {
    assert.doesNotMatch(html, /<img|<b>|<div>/, html);
    assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  }
  // Intended Markdown keeps working, and code spans and fences still show tags as code.
  assert.equal(md.inline('**a** `<ul>` [[closure]]'), '<strong>a</strong> <code>&lt;ul&gt;</code> <button type="button" class="term" data-term="closure">closure</button>');
  assert.match(md.block('```html\n<ul></ul>\n```'), /<pre class="code" data-lang="html"><code>.*&lt;/s);
  const visual = await compiledBlock({ id: 'pic', kind: 'visual', visual: 'diagram', title: pair('Т', 'T'), textEquivalent: pair(sample), spec: {} });
  assert.doesNotMatch(visual.textEquivalent.uk, /<img/);
  // Links: web, relative and in-page addresses only.
  assert.match(md.inline('[ok](https://example.com) [rel](./a.html) [top](#x)'), /href="https:\/\/example.com".*href=".\/a.html".*href="#x"/);
  assert.equal(md.inline('[click](javascript:alert(1))'), 'click');
});

test('the shown text of a glossary link is inline Markdown: code spans and bold render, HTML stays text', () => {
  assert.equal(md.inline('[[closure|`makeCounter` **closure**]]'), '<button type="button" class="term" data-term="closure"><code>makeCounter</code> <strong>closure</strong></button>');
  assert.equal(md.inline('[[closure|a <b>tag</b>]]'), '<button type="button" class="term" data-term="closure">a &lt;b&gt;tag&lt;/b&gt;</button>');
  assert.equal(md.inline('[[closure]]'), '<button type="button" class="term" data-term="closure">closure</button>');
});

test('a glossary link whose shown text holds "]" or another link is reported, wherever the text is (rule 46)', () => {
  assert.deepEqual(glossaryLinkProblems('[[closure|`makeCounter` **closure**]] and [[closure]]'), []);
  assert.deepEqual(glossaryLinkProblems('a table cell [[closure\\|the closure]]'), []);
  // `[[k, v]]` in code is not a link; a fenced block is skipped as a whole.
  assert.deepEqual(glossaryLinkProblems('write `[[k, v]]` and `[[closure|x` here\n\n```js\nconst a = [[closure|1]];\n```'), []);
  const bracket = glossaryLinkProblems('see [[closure|`items[0]` closure]] here');
  assert.equal(bracket.length, 1);
  assert.match(bracket[0], /\[\[closure\|`items\[0\]` closure\]\] here…" does not close: its shown text ends at the first "\]"/);
  assert.match(glossaryLinkProblems('[[closure|see [[scope]] first]]')[0], /holds another link/);
  assert.match(glossaryLinkProblems('[[closure|a [[scope|b]]')[0], /holds another link/);
  // Reported with the field path from every prose field, hints and feedback included.
  const block = { ...exercise, strings: undefined, hints: { nudge: pair('[[closure|`a[0]`]]', 'n'), explanation: pair('е', 'e') }, instructions: pair('і', 'i'), testTitles: { 'prints the total': pair('т', 't') }, solutionNote: pair('р', 'r'), feedback: [{ when: { test: 'prints the total' }, message: pair('ф', '[[closure|`b[1]`]]') }] };
  const found = staticIssuesForLesson(lessonWith([block], { cart: { ...exerciseAssets.cart, starter: { 'index.js': '' } } }), ctx).filter((i) => /rule 46/.test(i.message)).map((i) => i.path);
  assert.deepEqual(found, ['lesson js-01-09-sample › block "cart" › hints.nudge.uk', 'lesson js-01-09-sample › block "cart" › feedback[0].message.en']);
});

test('lesson files that the repository ignores (dist/, build/, coverage/, .env) are reported', () => {
  const dir = path.join(CONTENT_DIR, 'units', 'JS-01', 'js-01-99-ignored-files');
  const lesson = {
    dir,
    source: { blocks: [{ id: 'demo', kind: 'example', dir: 'demo' }, { id: 'task', kind: 'exercise', dir: 'task' }] },
    assets: {
      demo: { files: { 'index.js': '', 'dist/bundle.js': '', '.env': '', '.env.example': '' } },
      task: { starter: { 'index.js': '', 'coverage/report.json': '' }, solution: { 'build/out.js': '' }, variants: { wrong: { '.env.local': '' } } },
    },
  };
  const found = gitIgnoredLessonFiles(new Map([['js-01-99-ignored-files', lesson]]));
  assert.deepEqual(found.get('js-01-99-ignored-files')?.sort(), ['demo/.env', 'demo/dist/bundle.js', 'task/solution/build/out.js', 'task/starter/coverage/report.json', 'task/wrong/.env.local']);
});

test('TypeError feedback that quotes "is not a function" is a rule-33 warning when the checks guard the function first', () => {
  const rule = { when: { error: 'TypeError' }, message: pair('Якщо бачиш `total is not a function`, …', 'If you see `total is not a function`, …') };
  const warningsFor = (tests) => staticIssuesForLesson(lessonWith([{ ...exercise, feedback: [rule] }], { cart: { ...exerciseAssets.cart, tests } }), ctx).filter((i) => i.level === 'warning');
  for (const tests of ['test("prints the total", () => { expect(typeof scope.total, "type of total").toBe("function"); });', 'test("prints the total", () => { requireFunction("total"); });', 'test("prints the total", () => { expect(scope.total).toBeTypeOf("function"); });']) {
    const found = warningsFor(tests);
    assert.equal(found.length, 1, tests);
    assert.match(found[0].message, /rule 33/);
  }
  // Unguarded checks really do report "… is not a function" after a load crash.
  assert.deepEqual(warningsFor('test("prints the total", () => { expect(scope.total(2)).toBe(2); });'), []);
  assert.deepEqual(warningsFor('test("prints the total", () => { expect(typeof scope.total(2)).toBe("number"); });'), []);
});

test('a diagram wider than the 450 px lesson column is a warning while authoring and an error for a release', async () => {
  const wide = { id: 'wide', kind: 'visual', visual: 'diagram', title: pair('Т', 'T'), textEquivalent: pair('т', 't'), spec: { layout: 'grid', nodes: ['a', 'b', 'c', 'd', 'e'].map((id, col) => ({ id, label: `node ${id}`, w: 140, col, row: 0 })), steps: [{ caption: pair('к', 'c') }] } };
  const narrow = { ...wide, id: 'narrow', spec: { nodes: [{ id: 'a', label: 'A' }], steps: [{ caption: pair('к', 'c') }] } };
  const compile = async (block, release) => (await compileLesson(lessonWith([block]), { ...ctx, visuals, release })).issues.filter((i) => /px wide/.test(i.message));
  const authoring = await compile(wide, false);
  assert.equal(authoring.length, 1);
  assert.equal(authoring[0].level, 'warning');
  assert.match(authoring[0].message, /the diagram is \d+ px wide; the lesson column fits 450 px/);
  const release = await compile(wide, true);
  assert.equal(release.length, 1);
  assert.equal(release[0].level, undefined, 'an error for a release');
  assert.deepEqual(await compile(narrow, false), []);
});

test('an id that YAML read as null, a boolean or a number is reported with its cause and path', () => {
  const issuesOf = (blocks) => staticIssuesForLesson(lessonWith(blocks), ctx).map((i) => `${i.path}: ${i.message}`);
  const prediction = (options) => ({ id: 'guess', kind: 'prediction', prompt: pair('п', 'p'), explanation: pair('е', 'e'), answer: { type: 'choice', options, correct: ['a'] } });
  const found = issuesOf([prediction([{ id: 'a', text: pair('а', 'a') }, { id: null, text: pair('н', 'n') }, { id: true, text: pair('т', 't') }])]);
  assert.ok(found.some((m) => /block "guess"\.answer\.options\[1\]\.id: id is null \(unquoted null or ~\?/.test(m)), found.join('\n'));
  assert.ok(found.some((m) => /block "guess"\.answer\.options\[2\]\.id: id is the YAML boolean true, not text \(unquoted\? quote it: id: "true"\)/.test(m)), found.join('\n'));
  const block = issuesOf([{ id: null, kind: 'explanation', title: pair('т', 't'), body: pair('т', 't') }]);
  assert.ok(block.some((m) => /› blocks\[0\]\.id: id is null/.test(m)), block.join('\n'));
  const review = issuesOf([{ id: 'recall', kind: 'review', title: pair('П', 'R'), items: [{ id: null, from: 'js-01-01-code-runs', prompt: pair('п', 'p'), answer: { type: 'text', accept: ['1'] }, explanation: pair('е', 'e') }] }]);
  assert.ok(review.some((m) => /block "recall"\.items\[0\]\.id: id is null/.test(m)), review.join('\n'));
});

test('verify on a review question needs that question\'s own code; code or verify inside answer is reported', () => {
  const item = (extra) => ({ id: 'recall', kind: 'review', title: pair('П', 'R'), items: [{ id: 'q', from: 'js-01-01-code-runs', prompt: pair('п', 'p'), answer: { type: 'text', accept: ['1'] }, explanation: pair('е', 'e'), ...extra }] });
  const issuesOf = (extra) => staticIssuesForLesson(lessonWith([item(extra)]), ctx).map((i) => `${i.path}: ${i.message}`);
  assert.deepEqual(issuesOf({ code: 'console.log(1);', verify: { logs: ['1'] } }), []);
  const noCode = issuesOf({ verify: { logs: ['1'] } });
  assert.equal(noCode.length, 1);
  assert.match(noCode[0], /items\[0\]\.verify: verify runs this question's own "code" field \(as in a prediction\)/);
  const nested = issuesOf({ answer: { type: 'text', accept: ['1'], code: 'console.log(1);', verify: { logs: ['1'] } } });
  assert.ok(nested.some((m) => /items\[0\]\.answer\.verify: "verify" belongs to the question, next to "prompt", not inside "answer"/.test(m)), nested.join('\n'));
});

test('a local-task tool version is a plain string or bilingual text, compiled as plain text', async () => {
  const task = (version) => ({ id: 'local', kind: 'local-task', runtime: 'local-node', title: pair('Т', 'T'), intro: pair('і', 'i'), tools: [{ name: 'Node.js', version }], steps: [{ text: pair('к', 's') }], verify: [{ id: 'v', text: pair('в', 'v') }], troubleshooting: [{ problem: pair('п', 'p'), fix: pair('ф', 'f') }], recovery: pair('р', 'r') });
  const localized = await compiledBlock(task({ uk: '22.13 або новіший', en: '22.13 or **newer**' }));
  assert.deepEqual(localized.tools[0].version, { uk: '22.13 або новіший', en: '22.13 or **newer**' });
  assert.equal((await compiledBlock(task('22.13'))).tools[0].version, '22.13');
  const toolIssues = (version) => staticIssuesForLesson(lessonWith([task(version)]), ctx).filter((i) => /tools/.test(i.path)).map((i) => `${i.path}: ${i.message}`);
  assert.deepEqual(toolIssues('22.13'), []);
  assert.deepEqual(toolIssues({ uk: '22.13 або новіший', en: '22.13 or newer' }), []);
  assert.equal(toolIssues({ en: 'only English' }).length, 1);
  assert.match(toolIssues({ en: 'only English' })[0], /tools\[0\]\.version\.uk: missing or empty translation/);
});
