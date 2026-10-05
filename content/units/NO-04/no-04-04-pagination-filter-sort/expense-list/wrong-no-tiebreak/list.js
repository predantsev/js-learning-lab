// listRecords(records, query) — one page of expenses for GET /expenses.
//   query.category — optional: keep only this category
//   query.sort     — 'date' (default) or 'amountMinor', ascending; equal values ordered by id
//   query.limit    — a whole number from 1 to 50 (default 10)
//   query.cursor   — optional: the id of the last expense of the previous page
// All query values arrive as text. Returns { ok: true, items, nextCursor } or { ok: false, errors }.
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
    // Mistake: no tie-breaker — equal dates or amounts count as the same position.
    if (a[sort] !== b[sort]) return a[sort] < b[sort] ? -1 : 1;
    return 0;
  };

  // 1. filter  2. sort  3. continue after the cursor  4. cut one page
  const filtered = query.category === undefined ? records : records.filter((record) => record.category === query.category);
  const sorted = filtered.toSorted(compare);
  const rest = last === null ? sorted : sorted.filter((record) => compare(record, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items, nextCursor: rest.length > limit ? items.at(-1).id : null };
}
