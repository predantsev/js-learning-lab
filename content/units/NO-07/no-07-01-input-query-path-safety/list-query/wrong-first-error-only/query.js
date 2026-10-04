// Misconception: stopping at the first problem is enough; the client can fix them one by one.
const PARAMS = ['limit', 'offset', 'sort'];
const SORTS = ['name', 'price', 'category'];
const DIGITS = /^\d+$/;

export function parseListQuery(searchParams) {
  for (const key of new Set(searchParams.keys())) {
    if (!PARAMS.includes(key)) return { ok: false, errors: { [key]: 'unknownParam' } };
    if (searchParams.getAll(key).length > 1) return { ok: false, errors: { [key]: 'repeated' } };
  }

  const value = { limit: 20, offset: 0, sort: 'name' };
  const limit = searchParams.get('limit');
  if (limit !== null) {
    value.limit = DIGITS.test(limit) ? Number(limit) : NaN;
    if (!(value.limit >= 1 && value.limit <= 50)) return { ok: false, errors: { limit: 'outOfRange' } };
  }
  const offset = searchParams.get('offset');
  if (offset !== null) {
    if (!DIGITS.test(offset)) return { ok: false, errors: { offset: 'notWholeNumber' } };
    value.offset = Number(offset);
  }
  const sort = searchParams.get('sort');
  if (sort !== null) {
    if (!SORTS.includes(sort)) return { ok: false, errors: { sort: 'notAllowed' } };
    value.sort = sort;
  }
  return { ok: true, value };
}
