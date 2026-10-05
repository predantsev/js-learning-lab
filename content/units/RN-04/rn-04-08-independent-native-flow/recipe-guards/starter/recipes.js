// Recipe notes: a synthetic domain.
// A recipe: { id: 'r-01', title: string, servings: number, note: string }. An id is "r-" and exactly two digits.
// A link to a recipe: courselab://recipe/<id>.
// An edit form keeps its draft as text: { title: string, servings: string, note: string }.

// → { screen: 'Detail', params: { id } } or { screen: 'NotFound' }; never throws.
export function parseRecipeLink(url) {
  return { screen: 'NotFound' };
}

// → true when leaving the edit screen now would lose something.
export function hasUnsavedChanges(draft, saved) {
  return false;
}
