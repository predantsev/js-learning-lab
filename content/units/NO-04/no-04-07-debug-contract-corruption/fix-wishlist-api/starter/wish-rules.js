// The wishlist schema (read-only). checkWish(input) → { ok: true, value } or { ok: false, errors }.
//   name — required text, 1–80 characters after trimming
//   price — null or a whole number from 0;  acquired — boolean;  category — null or text up to 30
const FIELDS = ['name', 'price', 'acquired', 'category'];

export function checkWish(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, errors: { body: 'notObject' } };
  const errors = {};
  if (typeof input.name !== 'string' || input.name.trim() === '') errors.name = 'required';
  else if (input.name.trim().length > 80) errors.name = 'tooLong';
  if (input.price !== undefined && input.price !== null && !(Number.isInteger(input.price) && input.price >= 0)) errors.price = 'notWholeNumber';
  if (input.acquired !== undefined && typeof input.acquired !== 'boolean') errors.acquired = 'notBoolean';
  if (input.category !== undefined && input.category !== null && (typeof input.category !== 'string' || input.category.length > 30)) errors.category = 'invalid';
  for (const key of Object.keys(input)) if (!FIELDS.includes(key)) errors[key] = 'unknownField';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name: input.name.trim(), price: input.price ?? null, acquired: input.acquired ?? false, category: input.category ?? null } };
}
