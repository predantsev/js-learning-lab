// Also valid: arrow functions, and countLookalikes reuses the other two.
const isSameRecord = (a, b) => a === b;

const hasSameId = (a, b) => a.id === b.id;

const countLookalikes = (list, record) => {
  let count = 0;
  for (let i = 0; i < list.length; i++) {
    if (hasSameId(list[i], record) && !isSameRecord(list[i], record)) {
      count = count + 1;
    }
  }
  return count;
};

const wish = { id: "w-01", name: "%%headphones%%", price: 80 };
const alias = wish;
const lookalike = { id: "w-01", name: "%%headphones%%", price: 80 };
console.log(isSameRecord(wish, alias));
console.log(isSameRecord(wish, lookalike));
console.log(hasSameId(wish, alias));
console.log(hasSameId(wish, lookalike));
console.log(countLookalikes([wish, alias, lookalike], wish));
