// Rewrite formatPrice and makeLabel as arrow functions stored in const.
// Use an implicit return where the body can be one expression (a ternary counts).
// The program must print the same three lines as now.
const formatPrice = (price) => price === null ? "%%noPrice%%" : "%%pricePrefix%%" + price;

const makeLabel = (name, unit = "%%pcs%%") => name + " (" + unit + ")";

console.log(formatPrice(80));
console.log(formatPrice(null));
console.log(makeLabel("%%bulbs%%"));
