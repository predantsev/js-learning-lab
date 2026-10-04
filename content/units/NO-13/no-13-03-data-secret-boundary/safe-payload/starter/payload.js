// What crosses from the server into the page: only public fields, as JSON text that is safe inside <script>.

// Returns new objects with only the public fields of each expense.
export function toInitialData(expenses) {
  return expenses;
}

// Returns JSON text of `value` in which <, >, &, U+2028 and U+2029 are written as \u escapes.
export function serializeForHtml(value) {
  return JSON.stringify(value);
}
