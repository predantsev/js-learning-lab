// 1. makeLabel(name, unit) returns "name (unit)".
//    When no unit is given, use the default unit "%%pcs%%".
function makeLabel(name, unit = "%%pcs%%") {
  return name + " (" + unit + ")";
}

// 2. countExtras(first, ...) returns how many arguments came after the first one.
function countExtras(first, ...rest) {
  return rest.length;
}

console.log(makeLabel("%%bulbs%%"));
console.log(makeLabel("%%juice%%", "%%liters%%"));
console.log(countExtras());
console.log(countExtras("%%bulbs%%"));
console.log(countExtras("%%bulbs%%", "%%juice%%", "%%bread%%"));
