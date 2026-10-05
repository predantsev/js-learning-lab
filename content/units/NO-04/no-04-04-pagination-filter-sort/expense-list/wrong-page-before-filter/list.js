// Misconception: paging first and filtering afterwards gives the same result.
const SORTS = ['date', 'amountMinor'];

export function listRecords(records, query) {
  const errors = {};
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) errors.limit = 'outOfRange';
  const sort = query.sort ?? 'date';
  if (!SORTS.includes(sort)) errors.sort = 'unknownSort';
  const last = query.cursor === undefined ? null : records.find((record) => record.id === query.cursor);
  if (last === undefined) errors.cursor = 'unknownCursor';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const compare = (a, b) => {
    if (a[sort] !== b[sort]) return a[sort] < b[sort] ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
  const sorted = records.toSorted(compare);
  const rest = last === null ? sorted : sorted.filter((record) => compare(record, last) > 0);
  const page = rest.slice(0, limit);
  const items = query.category === undefined ? page : page.filter((record) => record.category === query.category);
  return { ok: true, items, nextCursor: rest.length > limit ? page.at(-1).id : null };
}
