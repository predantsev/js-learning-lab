// Checks of capstone step JS-02, shared by the four capstones. Every variant defines the same step
// strings (L, in the language the learner's project was created in):
//   nameValue + firstCheck      the first record's label: its name, then the value the label shows
//   secondName + secondCheck    the second record's label (the other branch: a fallback, the other
//                               switch case or the other kind of amount)
//   requiredMessage             the draft's message for an empty required field
//   invalidMessage              the draft's message for a value that is not allowed
// The checks look at the page, not at the code: any separator, element or variable name works.
const norm = (text) => (text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Elements inside `root` whose text contains every part, in this order. */
function linesWith(root, ...parts) {
  if (!root) return [];
  const wanted = parts.map(norm);
  return [...root.querySelectorAll('*')].filter((node) => {
    const text = norm(node.textContent);
    let from = 0;
    for (const part of wanted) {
      const at = text.indexOf(part, from);
      if (at < 0) return false;
      from = at + part.length;
    }
    return true;
  });
}
const shown = (...parts) => linesWith(screen.$('main'), ...parts).length > 0;

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

test('the first record label is shown', () => {
  expect(shown(L.nameValue, L.firstCheck), `a line inside <main> with "${L.nameValue}" and then "${L.firstCheck}"`).toBe(true);
});

test('the second record label is shown', () => {
  expect(shown(L.secondName, L.secondCheck), `a line inside <main> with "${L.secondName}" and then "${L.secondCheck}"`).toBe(true);
});

test('the draft gets the required-field message', () => {
  expect(shown(L.requiredMessage), `a line inside <main> with "${L.requiredMessage}"`).toBe(true);
});

test('the draft gets the invalid-value message', () => {
  expect(shown(L.invalidMessage), `a line inside <main> with "${L.invalidMessage}"`).toBe(true);
});

test('the script writes the new lines', () => {
  // The page as index.html describes it, before app.js runs.
  const typed = new DOMParser().parseFromString(files['index.html'] ?? '', 'text/html').querySelector('main');
  const typedText = norm(typed?.textContent);
  expect(linesWith(typed, L.secondName, L.secondCheck).length, 'lines of index.html that already hold the second label').toBe(0);
  expect(typedText.includes(norm(L.requiredMessage)), `index.html already contains "${L.requiredMessage}"`).toBe(false);
  expect(typedText.includes(norm(L.invalidMessage)), `index.html already contains "${L.invalidMessage}"`).toBe(false);
});
