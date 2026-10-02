// Glues the values into the address as they are: & # + and spaces are not encoded.
function buildFixtureUrl(base, { category, search } = {}) {
  const parts = [];
  if (category) parts.push("category=" + category);
  if (search) parts.push("search=" + search);
  return parts.length > 0 ? base + "?" + parts.join("&") : base;
}
