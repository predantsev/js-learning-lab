// The parameters are there, but the function still writes into top-level lets.
let priceText = "";
let label = "";

function makeLabel(name, price) {
  if (price === null) {
    priceText = "%%noPrice%%";
  } else {
    priceText = price + " %%uah%%";
  }
  label = name + " — " + priceText;
  return label;
}

console.log(makeLabel("%%headphones%%", 80));
console.log(makeLabel("%%tickets%%", null));
