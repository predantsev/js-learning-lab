const wishDefaults = { acquired: false, category: null };

// "own" when the record has the property itself,
// "inherited" when it is reachable only through the prototype chain,
// "missing" when it is not there at all.
function originOf(record, name) {
}

// The names of the enumerable properties the record gets only from
// its prototypes (not its own), in the order a for...in loop visits them.
function inheritedNames(record) {
  return []; // replace this line
}

const wish = Object.create(wishDefaults);
wish.id = "w-01";
wish.name = "%%lamp%%";
wish.acquired = true;

console.log(originOf(wish, "name"));
console.log(originOf(wish, "acquired"));
console.log(originOf(wish, "category"));
console.log(originOf(wish, "toString"));
console.log(originOf(wish, "price"));
console.log(inheritedNames(wish).join(","));
