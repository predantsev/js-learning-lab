const wishDefaults = { acquired: false, category: null };

// "own" when the record has the property itself,
// "inherited" when it is reachable only through the prototype chain,
// "missing" when it is not there at all.
function originOf(record, name) {
  if (record[name] === undefined) {
    return "missing";
  }
  if (Object.keys(record).includes(name)) {
    return "own";
  }
  return "inherited";
}

// The names of the enumerable properties the record gets only from
// its prototypes (not its own), in the order a for...in loop visits them.
function inheritedNames(record) {
  const names = [];
  for (const name in record) {
    if (!Object.hasOwn(record, name)) {
      names.push(name);
    }
  }
  return names;
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
