// Another valid approach: count every parameter in one pass, then check each allowed one.
const ALLOWED_SORTS = new Set(['name', 'price', 'category']);
const DEFAULTS = { limit: '20', offset: '0', sort: 'name' };

function wholeNumber(text) {
  // A whole number only when every character is a digit 0–9; otherwise null.
  return text.length > 0 && [...text].every((char) => char >= '0' && char <= '9') ? Number(text) : null;
}

export function parseListQuery(searchParams) {
  const counts = new Map();
  for (const [key] of searchParams) counts.set(key, (counts.get(key) ?? 0) + 1);

  const errors = {};
  const raw = { ...DEFAULTS };
  for (const [key, count] of counts) {
    if (!Object.hasOwn(DEFAULTS, key)) errors[key] = 'unknownParam';
    else if (count > 1) errors[key] = 'repeated';
    else raw[key] = searchParams.get(key);
  }

  const limit = wholeNumber(raw.limit);
  const offset = wholeNumber(raw.offset);
  if (!errors.limit && (limit === null || limit < 1 || limit > 50)) errors.limit = 'outOfRange';
  if (!errors.offset && offset === null) errors.offset = 'notWholeNumber';
  if (!errors.sort && !ALLOWED_SORTS.has(raw.sort)) errors.sort = 'notAllowed';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { limit, offset, sort: raw.sort } };
}
