// Returns the address of a fixture list as a string: `base` plus a query with the given filters.
// - Every filter value must reach the server unchanged, whatever characters it contains.
// - A filter that is undefined, null or "" is left out of the query.
function buildFixtureUrl(base, { category, search } = {}) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  const query = params.toString();
  return query === "" ? base : `${base}?${query}`;
}
