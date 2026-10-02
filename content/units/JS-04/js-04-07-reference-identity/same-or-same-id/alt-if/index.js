// Also valid, longhand: if/else around each comparison, continue for the record itself.
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

function countLookalikes(list, record) {
  let count = 0;
  for (const item of list) {
    if (item === record) {
      continue; // the record itself, under any name
    }
    if (item.id === record.id) {
      count = count + 1;
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
