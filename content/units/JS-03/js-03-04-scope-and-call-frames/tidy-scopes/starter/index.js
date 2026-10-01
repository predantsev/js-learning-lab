// Old code: every value lives in a top-level let, and makeLabel reads and changes them.
let name = "%%headphones%%";
let price = 80;
let priceText = "";
let label = "";

function makeLabel() {
  if (price === null) {
    priceText = "%%noPrice%%";
  } else {
    priceText = price + " %%uah%%";
  }
  label = name + " — " + priceText;
  return label;
}

console.log(makeLabel());
name = "%%tickets%%";
price = null;
console.log(makeLabel());
