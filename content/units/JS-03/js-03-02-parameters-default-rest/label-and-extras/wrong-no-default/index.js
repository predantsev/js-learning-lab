// countExtras is right, but makeLabel has no fallback: a missing unit becomes "(undefined)".
function makeLabel(name, unit) {
  return name + " (" + unit + ")";
}

function countExtras(first, ...rest) {
  return rest.length;
}

console.log(makeLabel("%%bulbs%%"));
console.log(makeLabel("%%juice%%", "%%liters%%"));
console.log(countExtras());
console.log(countExtras("%%bulbs%%"));
console.log(countExtras("%%bulbs%%", "%%juice%%", "%%bread%%"));
