// Also valid: remember the pair and leave both loops with a labeled break.
function findFirstSharedCategory(items) {
  let pair = null;
  search: for (let i = 0; i < items.length; i++) {
    if (items[i].category === null) {
      continue;
    }
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].category === items[j].category) {
        pair = [items[i], items[j]];
        break search;
      }
    }
  }
  return pair;
}

const wishes = [
  { id: "w-01", name: "%%headphones%%", category: "%%tech%%" },
  { id: "w-05", name: "%%tickets%%", category: null },
  { id: "w-02", name: "%%lamp%%", category: "%%home%%" },
  { id: "w-03", name: "%%bicycle%%", category: "%%sport%%" },
  { id: "w-06", name: "%%mug%%", category: "%%home%%" },
];
console.log(findFirstSharedCategory(wishes));
console.log(findFirstSharedCategory([]));
