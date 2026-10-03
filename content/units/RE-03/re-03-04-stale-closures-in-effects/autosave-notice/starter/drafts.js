// A fake draft store: an external system that remembers every autosaved title.
const saved = [];

export function saveDraft(title) {
  saved.push(title);
}

export function savedTitles() {
  return [...saved];
}
