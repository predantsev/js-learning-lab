// makeLabel gets what it needs as parameters and keeps its working values inside.
function makeLabel(name, price) {
  const priceText = price === null ? "%%noPrice%%" : price + " %%uah%%";
  return name + " — " + priceText;
}

console.log(makeLabel("%%headphones%%", 80));
console.log(makeLabel("%%tickets%%", null));
