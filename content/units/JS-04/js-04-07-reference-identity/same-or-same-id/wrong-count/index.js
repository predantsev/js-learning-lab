// "Same id means a lookalike": the record itself and its alias are counted too.
function isSameRecord(a, b) {
  return a === b;
}

function hasSameId(a, b) {
  return a.id === b.id;
}

function countLookalikes(list, record) {
  let count = 0;
  for (const item of list) {
    if (item.id === record.id) {
      count++;
    }
  }
  return count;
}

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
console.log(countLookalikes([wish, alias, lookalike], wish));
