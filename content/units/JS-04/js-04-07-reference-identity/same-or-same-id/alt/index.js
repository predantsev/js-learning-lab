// Also valid: the same two comparisons written as arrow functions.
const isSameRecord = (a, b) => a === b;

const hasSameId = (a, b) => a.id === b.id;

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
