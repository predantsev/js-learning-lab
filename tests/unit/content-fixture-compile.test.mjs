// The content compiler reads another content root (JSLL_CONTENT_ROOT, used by the end-to-end
// fixtures) and renders text fields in the shape the application displays them.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'content');
let outDir;
let result;
const lesson = async (id) => JSON.parse(await fs.readFile(path.join(outDir, 'lessons', `${id}.json`), 'utf8'));
const block = (l, id) => l.blocks.find((b) => b.id === id);

before(async () => {
  outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-unit-content-'));
  process.env.JSLL_CONTENT_ROOT = FIXTURES; // read when lib.mjs is first imported
  const lib = await import('../../scripts/content/lib.mjs');
  assert.equal(lib.CONTENT_DIR, FIXTURES);
  result = await lib.buildContent({ outDir, quiet: true });
});
after(async () => {
  await fs.rm(outDir, { recursive: true, force: true });
});

test('the fixture root compiles without issues, in syllabus order, with its redirects', () => {
  assert.deepEqual(result.issues, []);
  const lessons = result.index.stages[0].units[0].lessons;
  assert.deepEqual(lessons.map((l) => [l.id, l.authored]), [['js-01-01-fixture-basics', true], ['js-01-02-fixture-practice', true], ['js-01-03-fixture-planned', false]]);
  assert.equal(result.index.redirects['js-01-01-fixture-basics#basics-old-intro'], 'js-01-01-fixture-basics#basics-intro');
});

test('check titles are inline text, placeholders plain text, objectives and notes inline', async () => {
  const l1 = await lesson('js-01-01-fixture-basics');
  assert.deepEqual(block(l1, 'basics-exercise').testTitles['prints the label'], { uk: 'Перший рядок містить назву', en: 'The first line contains the label' });
  assert.doesNotMatch(l1.objectives[0].uk, /<p>/);
  const l2 = await lesson('js-01-02-fixture-practice');
  assert.deepEqual(block(l2, 'practice-predict').answer.placeholder, { uk: 'Число', en: 'A number' });
  assert.equal(block(l2, 'practice-local').tools[0].note.uk, 'потрібен для локальних завдань');
  // Block text (explanations, hints) stays block Markdown.
  assert.match(block(l1, 'basics-exercise').hints.nudge.uk, /^<p>/);
});
