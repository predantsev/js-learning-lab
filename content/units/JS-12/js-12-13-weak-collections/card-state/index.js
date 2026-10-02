const wishes = ["%%headphones%%", "%%lamp%%", "%%bicycle%%"];

const list = document.createElement("ul");
document.body.append(list);

// UI state of each card ("is it expanded?"), attached to the element itself.
const expanded = new WeakMap();

for (const name of wishes) {
  const card = document.createElement("li");
  card.textContent = name;
  list.append(card);
  expanded.set(card, false);
}

const first = list.firstElementChild;
expanded.set(first, true);
console.log("%%firstExpanded%%", expanded.get(first));

// The card leaves the page. Our variable `first` still points to it.
first.remove();
console.log("%%cardsLeft%%", list.children.length);
console.log("%%stillReachable%%", expanded.has(first));
