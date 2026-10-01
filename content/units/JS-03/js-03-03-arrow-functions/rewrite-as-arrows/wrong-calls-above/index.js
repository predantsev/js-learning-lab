// The arrows are right, but the calls still sit above them: the first call hits the TDZ.
console.log(formatPrice(80));
console.log(formatPrice(null));
console.log(makeLabel("%%bulbs%%"));

const formatPrice = (price) => price === null ? "%%noPrice%%" : "%%pricePrefix%%" + price;

const makeLabel = (name, unit = "%%pcs%%") => name + " (" + unit + ")";
