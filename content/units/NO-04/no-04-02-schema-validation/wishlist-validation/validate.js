// The wishlist schema, checked at the edge of the server: before anything reaches the records.
// Returns { ok: true, value } with a parsed wish, or { ok: false, errors } with EVERY problem found.
const NAME_MAX = 80;
const CATEGORY_MAX = 30;
const KNOWN = ['name', 'price', 'acquired', 'category'];

export function validateWishInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: 'notObject' } };
  }
  const errors = {};

  // name: a text of 1–80 characters after trimming
  if (input.name === undefined) errors.name = 'required';
  else if (typeof input.name !== 'string') errors.name = 'notString';
  else if (input.name.trim() === '') errors.name = 'required';
  else if (input.name.trim().length > NAME_MAX) errors.name = 'tooLong';

  // price: optional; null or a whole number from 0 up
  if (input.price !== undefined && input.price !== null) {
    if (typeof input.price !== 'number') errors.price = 'notNumber';
    else if (!Number.isInteger(input.price)) errors.price = 'notWhole';
    else if (input.price < 0) errors.price = 'negative';
  }

  // acquired: optional boolean
  if (input.acquired !== undefined && typeof input.acquired !== 'boolean') errors.acquired = 'notBoolean';

  // category: optional; null or a text of up to 30 characters
  if (input.category !== undefined && input.category !== null) {
    if (typeof input.category !== 'string') errors.category = 'notString';
    else if (input.category.trim().length > CATEGORY_MAX) errors.category = 'tooLong';
  }

  // Any other key is refused: the client cannot smuggle in fields the API never promised.
  for (const key of Object.keys(input)) {
    if (!KNOWN.includes(key)) errors[key] = 'unknownField';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  // The parsed value: only known fields, trimmed text and defaults filled in.
  return {
    ok: true,
    value: {
      name: input.name.trim(),
      price: input.price ?? null,
      acquired: input.acquired ?? false,
      category: input.category?.trim() || null,
    },
  };
}
