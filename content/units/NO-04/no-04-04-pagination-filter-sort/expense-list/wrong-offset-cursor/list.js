// Misconception: an offset never skips or repeats, so the "cursor" can just be a position number.
const SORTS = ['date', 'amountMinor'];

export function listRecords(records, query) {
  const errors = {};
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) errors.limit = 'outOfRange';
  const sort = query.sort ?? 'date';
  if (!SORTS.includes(sort)) errors.sort = 'unknownSort';
  const offset = query.cursor === undefined ? 0 : Number(query.cursor);
  if (!Number.isInteger(offset)) errors.cursor = 'unknownCursor';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const compare = (a, b) => {
    if (a[sort] !== b[sort]) return a[sort] < b[sort] ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
  const filtered = query.category === undefined ? records : records.filter((record) => record.category === query.category);
  const sorted = filtered.toSorted(compare);
  const items = sorted.slice(offset, offset + limit);
  return { ok: true, items, nextCursor: offset + limit < sorted.length ? String(offset + limit) : null };
}
