// A single = assigns instead of comparing: it overwrites a.id and returns the id text.
function isSameRecord(a, b) {
  return a === b;
}

function hasSameId(a, b) {
  return a.id = b.id;
}

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
