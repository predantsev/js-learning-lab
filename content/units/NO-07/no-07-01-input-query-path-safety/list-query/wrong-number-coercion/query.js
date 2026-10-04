// Misconception: Number() plus Number.isInteger() is a strict enough check for a number in a query.
const PARAMS = ['limit', 'offset', 'sort'];
const SORTS = ['name', 'price', 'category'];

export function parseListQuery(searchParams) {
  const errors = Object.create(null);
  for (const key of new Set(searchParams.keys())) {
    if (!PARAMS.includes(key)) errors[key] = 'unknownParam';
    else if (searchParams.getAll(key).length > 1) errors[key] = 'repeated';
  }

  const value = { limit: 20, offset: 0, sort: 'name' };
  const raw = (key) => (errors[key] ? null : searchParams.get(key));

  if (raw('limit') !== null) {
    value.limit = Number(raw('limit'));
    if (!Number.isInteger(value.limit) || value.limit < 1 || value.limit > 50) errors.limit = 'outOfRange';
  }
  if (raw('offset') !== null) {
    value.offset = Number(raw('offset'));
    if (!Number.isInteger(value.offset) || value.offset < 0) errors.offset = 'notWholeNumber';
  }
  if (raw('sort') !== null) {
    if (SORTS.includes(raw('sort'))) value.sort = raw('sort');
    else errors.sort = 'notAllowed';
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}
