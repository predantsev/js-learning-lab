// What crosses from the server into the page: only public fields, as JSON text that is safe inside <script>.

// Returns new objects with only the public fields of each expense.
export function toInitialData(expenses) {
  return expenses.map(({ id, label, amountMinor, date, category }) => ({ id, label, amountMinor, date, category }));
}

const ESCAPES = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

// Returns JSON text of `value` in which <, >, &, U+2028 and U+2029 are written as \u escapes.
export function serializeForHtml(value) {
  // Only < can start </script>.
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
