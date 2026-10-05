// Returns the address of a fixture list as a string: `base` plus a query with the given filters.
// - Every filter value must reach the server unchanged, whatever characters it contains.
// - A filter that is undefined, null or "" is left out of the query.
function buildFixtureUrl(base, { category, search } = {}) {
  // your code here
}

// To try it, add for example:
// console.log(buildFixtureUrl("http://127.0.0.1:4300/data/wishes.json", { category: "%%homeGarden%%" }));
