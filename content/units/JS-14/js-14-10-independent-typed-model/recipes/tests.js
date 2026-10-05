import { indexById } from './domain/helpers.ts';
import { parseRecipes } from './domain/parse.ts';
import { renderRecipe } from './ui/render.ts';

const recipe = (fields) => ({ id: 'r-04', title: L.pancakes, servings: 2, tags: [L.breakfast], rating: 4, course: 'main', ...fields });
const parse = (records) => parseRecipes(JSON.stringify(records));
const errorsOf = (result) => (result.ok ? [] : [...result.errors].sort());

test('indexById maps every id to its item, for any item type', () => {
  const recipes = [recipe({}), recipe({ id: 'r-05', title: L.pie })];
  const byId = indexById(recipes);
  expect(byId instanceof Map, 'indexById returns a Map').toBe(true);
  expect(byId.get('r-05')?.title, 'title of r-05').toBe(L.pie);
  const wishes = indexById([{ id: 'w-02', name: 'lamp' }]);
  expect(wishes.get('w-02')?.name, 'indexById with a wish').toBe('lamp');
  expect(byId.get('r-99'), 'an unknown id').toBeUndefined();
});

test('indexById keeps the first item when an id repeats', () => {
  const byId = indexById([recipe({}), recipe({ title: L.pie })]);
  expect(byId.size, 'number of keys for two items with id r-04').toBe(1);
  expect(byId.get('r-04')?.title, 'title kept for r-04').toBe(L.pancakes);
});

test('parseRecipes accepts valid recipes, including a null rating and empty tags', () => {
  const result = parse([recipe({}), recipe({ id: 'r-05', rating: null, tags: [], course: 'dessert' })]);
  expect(result.ok, 'ok for two valid recipes').toBe(true);
  expect(result.value?.map((item) => item.id), 'ids in value').toEqual(['r-04', 'r-05']);
});

test('parseRecipes reports broken JSON and a non-array without throwing', () => {
  let broken;
  expect(() => {
    broken = parseRecipes('[{"id": "r-04"');
  }, 'parseRecipes with broken JSON').not.toThrow();
  expect(broken, 'broken JSON').toEqual({ ok: false, errors: ['invalid-json'] });
  expect(parse(recipe({})), 'one object instead of an array').toEqual({ ok: false, errors: ['not-an-array'] });
});

test('servings must be a positive whole number', () => {
  expect(errorsOf(parse([recipe({ servings: 0 })])), 'servings 0').toEqual(['0.servings']);
  expect(errorsOf(parse([recipe({ servings: 2.5 })])), 'servings 2.5').toEqual(['0.servings']);
  expect(errorsOf(parse([recipe({ servings: '4' })])), 'servings "4"').toEqual(['0.servings']);
});

test('rating is null or a whole number from 1 to 5', () => {
  expect(errorsOf(parse([recipe({ rating: 6 })])), 'rating 6').toEqual(['0.rating']);
  expect(errorsOf(parse([recipe({ rating: 0 })])), 'rating 0').toEqual(['0.rating']);
  expect(errorsOf(parse([recipe({ rating: 3.5 })])), 'rating 3.5').toEqual(['0.rating']);
  expect(errorsOf(parse([recipe({ rating: 1 }), recipe({ id: 'r-05', rating: 5 })])), 'ratings 1 and 5').toEqual([]);
});

test('tags are a list of text and course is main or dessert', () => {
  expect(errorsOf(parse([recipe({ tags: L.breakfast })])), 'tags as one text').toEqual(['0.tags']);
  expect(errorsOf(parse([recipe({ tags: [L.breakfast, 7] })])), 'a number among the tags').toEqual(['0.tags']);
  expect(errorsOf(parse([recipe({ course: 'soup' })])), 'course "soup"').toEqual(['0.course']);
});

test('title and id are required, and a non-object record is reported', () => {
  expect(errorsOf(parse([recipe({ title: '  ' })])), 'a blank title').toEqual(['0.title']);
  expect(errorsOf(parse([recipe({ id: undefined })])), 'no id').toEqual(['0.id']);
  expect(errorsOf(parse([recipe({}), null])), 'null as the second record').toEqual(['1.record']);
});

test('a repeated id is reported at the later record', () => {
  expect(errorsOf(parse([recipe({}), recipe({ title: L.pie })])), 'two recipes with id r-04').toEqual(['1.duplicate-id']);
});

test('renderRecipe shows the title, the course and the servings', () => {
  expect(renderRecipe(recipe({ course: 'dessert', servings: 6 })), 'renderRecipe').toBe(`${L.pancakes} (dessert, 6)`);
});

test('the program prints the pie and the errors of the damaged record', () => {
  expect(logs()[0], 'the first printed line').toBe(`${L.pie} (dessert, 8)`);
  expect(logs()[1]?.split(', ').sort(), 'the errors in the second line').toEqual(['0.course', '0.rating', '0.servings', '0.tags', '0.title']);
});
