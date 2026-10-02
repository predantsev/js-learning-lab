// A single = assigns instead of comparing: it overwrites a.id and returns the id text.
function isSameRecord(a, b) {
  return a === b;
}

function hasSameId(a, b) {
  return a.id = b.id;
}

function countLookalikes(list, record) {
  let count = 0;
  for (const item of list) {
    if (item !== record && item.id === record.id) {
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
