// Recipe notes: a synthetic domain.
// A recipe: { id: 'r-01', title: string, servings: number, note: string }. An id is "r-" and exactly two digits.
// A link to a recipe: courselab://recipe/<id>.
// An edit form keeps its draft as text: { title: string, servings: string, note: string }.

// → { screen: 'Detail', params: { id } } or { screen: 'NotFound' }; never throws.
const NOT_FOUND = { screen: 'NotFound' };

export function parseRecipeLink(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return NOT_FOUND;
  }
  if (parsed.protocol !== 'courselab:' || parsed.host !== 'recipe') return NOT_FOUND;
  const parts = parsed.pathname.split('/').filter((part) => part !== '');
  if (parts.length !== 1) return NOT_FOUND;
  let id;
  try {
    id = decodeURIComponent(parts[0]);
  } catch {
    return NOT_FOUND;
  }
  return /^r-\d{2}$/.test(id) ? { screen: 'Detail', params: { id } } : NOT_FOUND;
}

// → true when leaving the edit screen now would lose something.
export function hasUnsavedChanges(draft, saved) {
  const servingsText = draft.servings.trim();
  const servingsChanged = servingsText === '' || Number(servingsText) !== saved.servings;
  return draft.title.trim() !== saved.title || draft.note.trim() !== saved.note || servingsChanged;
}
