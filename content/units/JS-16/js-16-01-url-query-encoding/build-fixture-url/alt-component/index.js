// Returns the address of a fixture list as a string: `base` plus a query with the given filters.
// - Every filter value must reach the server unchanged, whatever characters it contains.
// - A filter that is undefined, null or "" is left out of the query.
function buildFixtureUrl(base, { category, search } = {}) {
  const parts = [];
  if (category != null && category !== "") parts.push("category=" + encodeURIComponent(category));
  if (search != null && search !== "") parts.push("search=" + encodeURIComponent(search));
  return parts.length > 0 ? base + "?" + parts.join("&") : base;
}
