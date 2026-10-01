// Rewrite formatPrice and makeLabel as arrow functions stored in const.
// Use an implicit return where the body can be one expression (a ternary counts).
// The program must print the same three lines as now.
console.log(formatPrice(80));
console.log(formatPrice(null));
console.log(makeLabel("%%bulbs%%"));

function formatPrice(price) {
  if (price === null) {
    return "%%noPrice%%";
  }
  return "%%pricePrefix%%" + price;
}

function makeLabel(name, unit = "%%pcs%%") {
  return name + " (" + unit + ")";
}
