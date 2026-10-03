// Recipe notes: a synthetic domain.
// A recipe: { id: 'r-01', title: string, servings: number, note: string }. An id is "r-" and exactly two digits.
// A link to a recipe: courselab://recipe/<id>.
// An edit form keeps its draft as text: { title: string, servings: string, note: string }.

// → { screen: 'Detail', params: { id } } or { screen: 'NotFound' }; never throws.
const PREFIX = 'courselab://recipe/';

export function parseRecipeLink(url) {
  if (typeof url !== 'string' || !url.startsWith(PREFIX)) return { screen: 'NotFound' };
  const rest = url.slice(PREFIX.length).split(/[?#]/)[0];
  if (rest === '' || rest.includes('/')) return { screen: 'NotFound' };
  try {
    const id = decodeURIComponent(rest);
    if (/^r-[0-9]{2}$/.test(id)) return { screen: 'Detail', params: { id } };
  } catch {
    // broken encoding: falls through to NotFound
  }
  return { screen: 'NotFound' };
}

// → true when leaving the edit screen now would lose something.
export function hasUnsavedChanges(draft, saved) {
  const same = (text, value) => text.trim() === value;
  const servings = Number.parseFloat(draft.servings);
  const sameServings = draft.servings.trim() !== '' && Number(draft.servings) === servings && servings === saved.servings;
  return !(same(draft.title, saved.title) && same(draft.note, saved.note) && sameServings);
}
