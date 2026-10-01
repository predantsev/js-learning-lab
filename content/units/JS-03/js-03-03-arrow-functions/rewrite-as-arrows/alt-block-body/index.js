// A block body with return is also correct; only makeLabel uses an implicit return here.
const formatPrice = (price) => {
  if (price === null) {
    return "%%noPrice%%";
  }
  return "%%pricePrefix%%" + price;
};

const makeLabel = (name, unit = "%%pcs%%") => name + " (" + unit + ")";

console.log(formatPrice(80));
console.log(formatPrice(null));
console.log(makeLabel("%%bulbs%%"));
