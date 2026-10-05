const urls = [
  "/lab/wishlist/items?lang=%%lang%%&delay=300",
  "/lab/planner/items?lang=%%lang%%&delay=200",
  "/lab/habits/items?lang=%%lang%%&delay=100",
];

async function getItems(url) {
  const response = await fetch(url);
  const body = await response.json();
  return body.items;
}

// One after another: each request starts only when the previous one has answered.
let startedAt = Date.now();
const oneByOne = [];
for (const url of urls) {
  oneByOne.push(await getItems(url));
}
console.log("%%sequential%%", Date.now() - startedAt, "%%ms%%");

// Together: all three start at once, then we wait for all of them.
startedAt = Date.now();
const together = await Promise.all(urls.map((url) => getItems(url)));
console.log("%%concurrent%%", Date.now() - startedAt, "%%ms%%");
console.log("%%counts%%", together.map((items) => items.length));
