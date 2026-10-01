// An arrow function, an early return, and top-level consts that only hold results.
const makeLabel = (name, price) => {
  if (price === null) {
    return name + " — %%noPrice%%";
  }
  const priceText = price + " %%uah%%";
  return name + " — " + priceText;
};

const label = makeLabel("%%headphones%%", 80);
console.log(label);
console.log(makeLabel("%%tickets%%", null));
