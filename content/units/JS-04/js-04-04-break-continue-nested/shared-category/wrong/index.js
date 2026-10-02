// break leaves only the inner loop: the outer loop goes on, and a later pair overwrites the first.
function findFirstSharedCategory(items) {
  let pair = null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].category === null) {
      continue;
    }
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].category === items[j].category) {
        pair = [items[i], items[j]];
        break;
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
