import { hasUnsavedChanges, parseRecipeLink } from './recipes.js';

const NOT_FOUND = { screen: 'NotFound' };
const call = (fn) => {
  try {
    return fn();
  } catch (error) {
    return `threw ${error.name}`;
  }
};
const link = (url) => call(() => parseRecipeLink(url));
const dirty = (draft) => call(() => hasUnsavedChanges(draft, { id: 'r-07', title: L.soup, servings: 4, note: L.note }));
const draft = (changes) => ({ title: L.soup, servings: '4', note: L.note, ...changes });

test('a valid or encoded recipe link opens Detail with only the id', () => {
  expect(link('courselab://recipe/r-07'), 'courselab://recipe/r-07').toEqual({ screen: 'Detail', params: { id: 'r-07' } });
  expect(link('courselab://recipe/r%2D12'), 'courselab://recipe/r%2D12').toEqual({ screen: 'Detail', params: { id: 'r-12' } });
  expect(link('courselab://recipe/r-07?from=share#top'), 'courselab://recipe/r-07?from=share#top').toEqual({ screen: 'Detail', params: { id: 'r-07' } });
});

test('a malformed, unknown-shaped or foreign link gives NotFound without throwing', () => {
  const urls = [
    'courselab://recipe/%E0%A4%A',
    'courselab://recipe/',
    'courselab://recipe/r-7',
    'courselab://recipe/r-007',
    'courselab://recipe/t-02',
    'courselab://recipe/r-07/edit',
    'courselab://recipe/..%2Ftask%2Ft-02',
    'courselab://task/r-07',
    'https://example.com/recipe/r-07',
    'recipe r-07',
    '',
  ];
  for (const url of urls) expect(link(url), url).toEqual(NOT_FOUND);
});

test('an unchanged draft has nothing to lose', () => {
  expect(dirty(draft({})), 'the same title, servings and note').toBe(false);
  expect(dirty(draft({ title: `  ${L.soup} `, servings: ' 4 ', note: `${L.note} ` })), 'the same values with spaces at the ends').toBe(false);
  expect(dirty(draft({ servings: '04' })), 'servings typed as 04').toBe(false);
});

test('a changed field is unsaved work', () => {
  expect(dirty(draft({ title: L.otherTitle })), 'another title').toBe(true);
  expect(dirty(draft({ servings: '6' })), 'servings 6').toBe(true);
  expect(dirty(draft({ note: '' })), 'the note cleared').toBe(true);
  expect(dirty(draft({ servings: '' })), 'the servings field emptied').toBe(true);
  expect(dirty(draft({ servings: 'abc' })), 'servings that are not a number').toBe(true);
});
