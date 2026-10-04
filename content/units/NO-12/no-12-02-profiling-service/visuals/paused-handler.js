function compareNames(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

function sortByName(wishes) {
  return wishes.toSorted(compareNames);
}

function listByName(wishes, limit) {
  const page = [];
  for (let i = 0; i < limit; i++) {
    const sorted = sortByName(wishes);
    page.push(sorted[i]);
  }
  return page;
}

const wishes = [
  { id: 'w-3', name: '%%mug%%' },
  { id: 'w-1', name: '%%bicycle%%' },
  { id: 'w-2', name: '%%headphones%%' },
];
const page = listByName(wishes, 2);
console.log(page.map((wish) => wish.id).join(', '));
