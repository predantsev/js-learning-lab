// parseListQuery(searchParams): checks the query string of GET /items against an allowlist.
// Returns { ok: true, value: { limit, offset, sort } } or { ok: false, errors: { param: code } }.
export function parseListQuery(searchParams) {
  // TODO: check limit, offset and sort, and reject every other parameter.
  return { ok: true, value: { limit: 20, offset: 0, sort: 'name' } };
}
