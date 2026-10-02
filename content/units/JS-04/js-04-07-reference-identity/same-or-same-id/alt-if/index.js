// Also valid, longhand: if/else around each comparison.
function isSameRecord(a, b) {
  if (a === b) {
    return true;
  }
  return false;
}

function hasSameId(a, b) {
  if (a.id === b.id) {
    return true;
  } else {
    return false;
  }
}

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
