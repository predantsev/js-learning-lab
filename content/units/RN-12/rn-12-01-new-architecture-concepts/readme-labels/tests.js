import { labels, notes } from './labels.js';
import { readme } from './readme.js';

const LEGACY = ['c', 'e', 'g'];
const NEW = ['a', 'b', 'd', 'f'];
const BOXES = ['fabric', 'jsi', 'turbomodules'];

test('every README item has the label legacy or new', () => {
  for (const item of readme) {
    expect(['legacy', 'new'].includes(labels?.[item.id]), `label of item ${item.id} is 'legacy' or 'new'`).toBe(true);
  }
});

test('the old-architecture items are labelled legacy', () => {
  for (const id of LEGACY) expect(labels?.[id], `label of item ${id}`).toBe('legacy');
});

test('the New Architecture items are labelled new', () => {
  for (const id of NEW) expect(labels?.[id], `label of item ${id}`).toBe('new');
});

test('there are three notes, one for each box', () => {
  expect(Array.isArray(notes), 'notes is an array').toBe(true);
  expect(notes.map((note) => note?.box).sort(), 'the boxes of the notes, sorted').toEqual(BOXES);
});

test('every note names React Native 0.86', () => {
  expect(Array.isArray(notes) && notes.length > 0, 'notes has notes').toBe(true);
  for (const note of notes) expect(note?.version, `version of the note about ${note?.box}`).toBe('0.86');
});

test('every note explains its box in at least 30 characters', () => {
  expect(Array.isArray(notes) && notes.length > 0, 'notes has notes').toBe(true);
  for (const note of notes) {
    const text = typeof note?.text === 'string' ? note.text.trim() : '';
    expect(text.length, `length of the text about ${note?.box}`).toBeGreaterThanOrEqual(30);
  }
});
