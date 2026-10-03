import * as written from './record.js';

const FILE = 'domain/locker.js';
const lineOf = (line) => (files[`after/${FILE}`] ?? '').split('\n')[line - 1];
const text = (value, min = 10) => typeof value === 'string' && value.trim().length >= min;
// The defects of the pull request, by a piece of the line that carries them.
// A comment may point at the method's first line or at the line inside it that carries the defect.
const DEFECTS = {
  'no duplicate check': (line) => line.includes('arrive(parcel)') || line.includes('byCode.set(parcel.code, parcel)'),
  'undefined instead of null': (line) => line.includes('findByCode(code)') || line.includes('return byCode.get(code);'),
  'picked-up parcels stay in the queue': (line) =>
    ['pickUp(code)', 'byCode.delete(code)', 'nextToReturn()', 'queue.shift()', 'waitingCount()', 'return queue.length', 'oldest(limit)', 'queue.slice(0, limit)'].some((piece) => line.includes(piece)),
};
const decision = () => {
  expect(typeof written.decision, 'type of the decision export of record.js').toBe('object');
  return written.decision;
};
const comments = () => {
  expect(Array.isArray(written.comments), 'the comments export of record.js is an array').toBe(true);
  return written.comments;
};

test('the decision record names the choice, the rejected option and the consequences', () => {
  expect(text(decision().choice), 'choice has at least 10 characters').toBe(true);
  expect(text(decision().rejected?.option, 3) && text(decision().rejected?.reason), 'rejected names an option and a reason').toBe(true);
  expect(text(decision().consequences), 'consequences has at least 10 characters').toBe(true);
});

test('the evidence gives numbers at 1,000, 10,000 and 100,000 parcels', () => {
  const evidence = String(decision().evidence ?? '');
  const sizes = { '1,000': /(^|[^\d])1[ ,.\u00a0\u202f]?000(?![ ,.\u00a0\u202f]?\d)|1k\b/i, '10,000': /(^|[^\d])10[ ,.\u00a0\u202f]?000(?![ ,.\u00a0\u202f]?\d)|10k\b/i, '100,000': /(^|[^\d])100[ ,.\u00a0\u202f]?000(?![ ,.\u00a0\u202f]?\d)|100k\b/i };
  const missing = Object.keys(sizes).filter((size) => !sizes[size].test(evidence));
  expect(missing, 'data sizes the evidence does not mention').toEqual([]);
});

test('at least three comments, each complete and pointing at a real line', () => {
  expect(comments().length, 'number of comments').toBeGreaterThanOrEqual(3);
  for (const [i, comment] of comments().entries()) {
    expect(comment.file === FILE && Number.isInteger(comment.line) && lineOf(comment.line) !== undefined, `comment ${i + 1}: a real line of ${FILE}`).toBe(true);
    for (const field of ['problem', 'evidence', 'suggestion']) {
      expect(text(comment[field]), `comment ${i + 1}: ${field} has at least 10 characters`).toBe(true);
    }
    expect(typeof comment.blocking, `comment ${i + 1}: blocking is true or false`).toBe('boolean');
  }
});

test('blocking comments name at least two of the defects of the pull request', () => {
  const found = new Set();
  for (const comment of comments()) {
    const line = comment.blocking === true && comment.file === FILE ? lineOf(comment.line) : undefined;
    if (line === undefined) continue;
    for (const [defect, matches] of Object.entries(DEFECTS)) if (matches(line)) found.add(defect);
  }
  expect(found.size, `defects with a blocking comment (found: ${[...found].join(', ') || 'none'})`).toBeGreaterThanOrEqual(2);
});
