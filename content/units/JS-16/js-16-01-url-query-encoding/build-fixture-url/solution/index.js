// Returns the address of a fixture list as a string: `base` plus a query with the given filters.
// - Every filter value must reach the server unchanged, whatever characters it contains.
// - A filter that is undefined, null or "" is left out of the query.
function buildFixtureUrl(base, { category, search } = {}) {
  const url = new URL(base);
  for (const [name, value] of Object.entries({ category, search })) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(name, value);
    }
  }
  return url.href;
}

console.log(buildFixtureUrl("http://127.0.0.1:4300/data/wishes.json", { category: "%%homeGarden%%" }));
