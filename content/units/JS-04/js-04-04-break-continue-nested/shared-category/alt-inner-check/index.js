// Also valid: check for a missing category inside the comparison.
function findFirstSharedCategory(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].category !== null && items[i].category === items[j].category) {
        return [items[i], items[j]];
      }
    }
  }
  return null;
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
