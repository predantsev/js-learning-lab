// listRecords(records, query) — one page of expenses for GET /expenses.
//   query.category — optional: keep only this category
//   query.sort     — 'date' (default) or 'amountMinor', ascending; equal values ordered by id
//   query.limit    — a whole number from 1 to 50 (default 10)
//   query.cursor   — optional: the id of the last expense of the previous page
// All query values arrive as text. Returns { ok: true, items, nextCursor } or { ok: false, errors }.
export function listRecords(records, query) {
  // TODO: filter, sort with a tie-breaker, continue after the cursor, cut one page.
  return { ok: true, items: records.slice(0, 10), nextCursor: null };
}
