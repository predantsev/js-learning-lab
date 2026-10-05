// Misconception: looking a value up in a plain object is an allowlist ("in" also sees inherited keys).
const PARAMS = ['limit', 'offset', 'sort'];
const SORTS = { name: true, price: true, category: true };
const DIGITS = /^\d+$/;

export function parseListQuery(searchParams) {
  const errors = Object.create(null);
  for (const key of new Set(searchParams.keys())) {
    if (!PARAMS.includes(key)) errors[key] = 'unknownParam';
    else if (searchParams.getAll(key).length > 1) errors[key] = 'repeated';
  }

  const value = { limit: 20, offset: 0, sort: 'name' };
  const raw = (key) => (errors[key] ? null : searchParams.get(key));

  if (raw('limit') !== null) {
    value.limit = DIGITS.test(raw('limit')) ? Number(raw('limit')) : NaN;
    if (!(value.limit >= 1 && value.limit <= 50)) errors.limit = 'outOfRange';
  }
  if (raw('offset') !== null) {
    if (DIGITS.test(raw('offset'))) value.offset = Number(raw('offset'));
    else errors.offset = 'notWholeNumber';
  }
  if (raw('sort') !== null) {
    if (raw('sort') in SORTS) value.sort = raw('sort');
    else errors.sort = 'notAllowed';
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}
