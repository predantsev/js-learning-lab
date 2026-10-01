function makeCounter(start) {
  let count = start;
  function increment() {
    count = count + 1;
    return count;
  }
  return increment;
}

const clicks = makeCounter(0);
const views = makeCounter(100);

clicks();
clicks();
views();

console.log("clicks:", clicks());
console.log("views:", views());
