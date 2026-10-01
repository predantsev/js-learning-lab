// One wish, several names. Watch which names see each change.
const wish = {
  id: "w-01",
  name: "%%headphones%%",
  price: 80,
  acquired: false,
};
let alias = wish;

alias.price = 0;
console.log("wish.price:", wish.price);
console.log("wish === alias:", wish === alias);

function markAcquired(item) {
  item.acquired = true; // changes the object the caller passed in
}
markAcquired(wish);
console.log("wish.acquired:", wish.acquired);
console.log("alias.acquired:", alias.acquired);

const copy = {
  id: "w-01",
  name: "%%headphones%%",
  price: 0,
  acquired: true,
};
console.log("wish === copy:", wish === copy);
console.log("wish.id === copy.id:", wish.id === copy.id);
