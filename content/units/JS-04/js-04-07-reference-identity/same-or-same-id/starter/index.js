// true only when a and b are the very same object
// (two names of one record).
function isSameRecord(a, b) {
}

// true when a and b describe the same wish: their ids are equal.
function hasSameId(a, b) {
}

// How many items of the list describe the same wish as record
// (the same id) but are separate objects, not record itself.
function countLookalikes(list, record) {
}

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
console.log(countLookalikes([wish, alias, lookalike], wish));
