// The expense contract as a runtime check (read-only): what the client accepts from the server.
const CATEGORIES = ['food', 'transport', 'home', 'fun'];

// Returns { ok: true, value } for a valid expense, otherwise { ok: false, errors } (field → reason).
export function parseExpense(input) {
  if (typeof input !== 'object' || input === null) return { ok: false, errors: { body: 'not an object' } };
  const errors = {};
  if (typeof input.id !== 'string' || input.id === '') errors.id = 'not a non-empty text';
  if (typeof input.label !== 'string' || input.label.trim() === '' || input.label.length > 80) errors.label = 'not 1–80 characters';
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) errors.amountMinor = 'not a whole number above 0';
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = 'not YYYY-MM-DD';
  if (!CATEGORIES.includes(input.category)) errors.category = 'not a known category';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const { id, label, amountMinor, date, category } = input;
  return { ok: true, value: { id, label, amountMinor, date, category } };
}
