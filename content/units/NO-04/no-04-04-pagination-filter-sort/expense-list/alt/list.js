// Another valid solution: the page starts right after the cursor's position in the sorted list.
const SORTS = new Set(['date', 'amountMinor']);

export function listRecords(records, query) {
  const { category, sort = 'date', limit: limitText = '10', cursor } = query;
  const limit = Number(limitText);
  const errors = {};
  if (!(Number.isInteger(limit) && limit >= 1 && limit <= 50)) errors.limit = 'outOfRange';
  if (!SORTS.has(sort)) errors.sort = 'unknownSort';
  if (cursor !== undefined && !records.some((record) => record.id === cursor)) errors.cursor = 'unknownCursor';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const sorted = records
    .filter((record) => category === undefined || record.category === category)
    .sort((a, b) => (a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : a.id.localeCompare(b.id, 'en')));

  let start = 0;
  if (cursor !== undefined) {
    const position = sorted.findIndex((record) => record.id === cursor);
    start = position + 1;
  }
  const items = sorted.slice(start, start + limit);
  const more = start + limit < sorted.length;
  return { ok: true, items, nextCursor: more ? items[items.length - 1].id : null };
}
