// What crosses from the server into the page: only public fields, as JSON text that is safe inside <script>.

// Returns new objects with only the public fields of each expense.
export function toInitialData(expenses) {
  const keep = ['id', 'label', 'amountMinor', 'date', 'category'];
  for (const expense of expenses) {
    for (const field of Object.keys(expense)) {
      if (!keep.includes(field)) delete expense[field];
    }
  }
  return expenses;
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
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char]);
}
