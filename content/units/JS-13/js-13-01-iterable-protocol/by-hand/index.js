const tasks = ["%%water%%", "%%books%%", "%%grandma%%"];

// Ask the array for an iterator, then step it by hand.
const iterator = tasks[Symbol.iterator]();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());

// The same iterator, used again in a loop.
let count = 0;
for (const task of iterator) {
  count = count + 1;
}
console.log("%%again%%", count);
