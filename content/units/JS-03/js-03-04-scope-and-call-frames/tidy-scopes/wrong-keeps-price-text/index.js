// Half tidied: the label is local now, but priceText is still a top-level let
// that every call of makeLabel overwrites.
let priceText = "";

function makeLabel(name, price) {
  if (price === null) {
    priceText = "%%noPrice%%";
  } else {
    priceText = price + " %%uah%%";
  }
  const label = name + " — " + priceText;
  return label;
}

console.log(makeLabel("%%headphones%%", 80));
console.log(makeLabel("%%tickets%%", null));
