import { createElement, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as testing from './testing.js';
import { useImplementation } from './readingLog.js';
import { BookRow } from './BookRow.jsx';

// The learner's tests were registered when main.jsx imported readingLog.test.jsx; here they run
// again with print: false against the correct feature and against versions with one hidden defect.
async function runSuite({ functions, row } = {}) {
  useImplementation(functions);
  testing.restoreComponents();
  if (row) testing.replaceComponent(BookRow, row);
  const broken = Boolean(functions || row);
  if (broken) testing.setDefaultTimeout(600);
  try {
    return await testing.run({ print: false, bail: broken });
  } finally {
    useImplementation();
    testing.restoreComponents();
    testing.setDefaultTimeout(2000);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);

function correctSummary(books) {
  let pagesRead = 0;
  let finished = 0;
  for (const book of books) {
    pagesRead += book.pagesRead;
    if (book.finished) finished += 1;
  }
  return { pagesRead, finished };
}

const DEFECTS = {
  // like books.reduce(…) without an initial value
  emptyThrows: (books) => {
    if (books.length === 0) throw new TypeError('Reduce of empty array with no initial value');
    return correctSummary(books);
  },
  finishedLeftOut: (books) => ({ pagesRead: correctSummary(books.filter((book) => !book.finished)).pagesRead, finished: correctSummary(books).finished }),
};

// Accepts pages given as text, as `Number(raw.pagesRead) >= 0` would.
function lenientValidate(input) {
  const raw = typeof input === 'object' && input !== null ? input : {};
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const pages = Number(raw.pagesRead);
  if (typeof raw.id !== 'string' || raw.id === '' || title.length < 1 || title.length > 80 || !(pages >= 0) || typeof raw.finished !== 'boolean') {
    return { ok: false, errors: { book: 'invalid' } };
  }
  return { ok: true, value: { id: raw.id, title, pagesRead: pages, finished: raw.finished } };
}

function brokenRow({ statusChanges = true, labelled = true }) {
  const h = createElement;
  return function BrokenBookRow({ book }) {
    const [finished, setFinished] = useState(book.finished);
    const shown = statusChanges ? finished : book.finished;
    return h(View, null,
      h(Text, null, book.title),
      h(Text, null, shown ? L.finished : L.reading),
      h(Pressable, {
        accessibilityRole: 'button',
        accessibilityLabel: labelled ? `${L.markFinished}: ${book.title}` : undefined,
        onPress: () => setFinished((value) => !value),
      }, h(Text, null, finished ? '✓' : '○')));
  };
}

let passesWithCorrectCode = false;
async function expectCatches(broken) {
  expect(passesWithCorrectCode, 'your tests pass with the correct reading log (the first check)').toBe(true);
  const results = await runSuite(broken);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with this defect').toBe(true);
}

test('your tests pass with the correct reading log', async () => {
  const results = await runSuite();
  expect(results.length, 'number of tests in readingLog.test.jsx').toBeGreaterThanOrEqual(3);
  expect(failing(results), 'your tests that fail with the correct reading log').toEqual([]);
  passesWithCorrectCode = true;
});

test('a test fails when an empty log throws instead of reading 0 pages', async () => {
  await expectCatches({ functions: { summary: DEFECTS.emptyThrows } });
});

test('a test fails when pages of finished books are left out of the total', async () => {
  await expectCatches({ functions: { summary: DEFECTS.finishedLeftOut } });
});

test('a test fails when stored pages given as text are accepted', async () => {
  await expectCatches({ functions: { validate: lenientValidate } });
});

test('a test fails when the toggle does not change the status', async () => {
  await expectCatches({ row: brokenRow({ statusChanges: false }) });
});

test('a test fails when the toggle has no accessible label', async () => {
  await expectCatches({ row: brokenRow({ labelled: false }) });
});
