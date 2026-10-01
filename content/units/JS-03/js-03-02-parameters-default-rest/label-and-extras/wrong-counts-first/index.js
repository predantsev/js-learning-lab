// The rest parameter swallows the first argument too, so every count is one too high.
function makeLabel(name, unit = "%%pcs%%") {
  return name + " (" + unit + ")";
}

function countExtras(...rest) {
  return rest.length;
}

console.log(makeLabel("%%bulbs%%"));
console.log(makeLabel("%%juice%%", "%%liters%%"));
console.log(countExtras());
console.log(countExtras("%%bulbs%%"));
console.log(countExtras("%%bulbs%%", "%%juice%%", "%%bread%%"));
