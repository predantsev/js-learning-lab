// let is right here: priceText is declared in the function box and assigned in a branch.
function makeLabel(name, price) {
  let priceText;
  if (price === null) {
    priceText = "%%noPrice%%";
  } else {
    priceText = price + " %%uah%%";
  }
  return name + " — " + priceText;
}

console.log(makeLabel("%%headphones%%", 80));
console.log(makeLabel("%%tickets%%", null));
