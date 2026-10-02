// The ternary sits inside a block without return, so formatPrice gives undefined.
const formatPrice = (price) => { price === null ? "%%noPrice%%" : "%%pricePrefix%%" + price; };

const makeLabel = (name, unit = "%%pcs%%") => name + " (" + unit + ")";

console.log(formatPrice(80));
console.log(formatPrice(null));
console.log(makeLabel("%%bulbs%%"));
