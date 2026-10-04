// Another valid approach: count every parameter in one pass, then check each allowed one;
// the errors live in a Map, so any parameter name (even __proto__) is just a key.
const ALLOWED_SORTS = new Set(['name', 'price', 'category']);
const DEFAULTS = { limit: '20', offset: '0', sort: 'name' };

function wholeNumber(text) {
  // A whole number only when every character is a digit 0–9; otherwise null.
  return text.length > 0 && [...text].every((char) => char >= '0' && char <= '9') ? Number(text) : null;
}

export function parseListQuery(searchParams) {
  const counts = new Map();
  for (const [key] of searchParams) counts.set(key, (counts.get(key) ?? 0) + 1);

  const errors = new Map();
  const raw = { ...DEFAULTS };
  for (const [key, count] of counts) {
    if (!Object.hasOwn(DEFAULTS, key)) errors.set(key, 'unknownParam');
    else if (count > 1) errors.set(key, 'repeated');
    else raw[key] = searchParams.get(key);
  }

  const limit = wholeNumber(raw.limit);
  const offset = wholeNumber(raw.offset);
  if (!errors.has('limit') && (limit === null || limit < 1 || limit > 50)) errors.set('limit', 'outOfRange');
  if (!errors.has('offset') && offset === null) errors.set('offset', 'notWholeNumber');
  if (!errors.has('sort') && !ALLOWED_SORTS.has(raw.sort)) errors.set('sort', 'notAllowed');

  if (errors.size > 0) return { ok: false, errors: Object.fromEntries(errors) };
  return { ok: true, value: { limit, offset, sort: raw.sort } };
}
