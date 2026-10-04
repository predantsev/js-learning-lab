// What crosses from the server into the page: only public fields, as JSON text that is safe inside <script>.

const PUBLIC_FIELDS = ['id', 'label', 'amountMinor', 'date', 'category'];

// Returns new objects with only the public fields of each expense.
export function toInitialData(expenses) {
  return expenses.map((expense) => {
    const visible = {};
    for (const field of PUBLIC_FIELDS) visible[field] = expense[field];
    return visible;
  });
}

// Returns JSON text of `value` in which <, >, &, U+2028 and U+2029 are written as \u escapes.
export function serializeForHtml(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
