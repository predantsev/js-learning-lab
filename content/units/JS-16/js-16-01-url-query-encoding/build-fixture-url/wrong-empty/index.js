// Encodes the values but always sends both parameters, empty or not.
function buildFixtureUrl(base, { category, search } = {}) {
  const url = new URL(base);
  url.searchParams.set("category", category ?? "");
  url.searchParams.set("search", search ?? "");
  return url.href;
}
