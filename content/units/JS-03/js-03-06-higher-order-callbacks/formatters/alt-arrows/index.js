const item = { name: "%%headphones%%", price: 80 };

// All four as arrow functions; withSuffix returns an arrow from an arrow.
const formatWith = (record, formatter) => formatter(record);

const shortLabel = (record) => record.name;

const longLabel = (record) => {
  const price = record.price + " %%uah%%";
  return record.name + " — " + price;
};

const withSuffix = (formatter, suffix) => (record) => formatter(record) + suffix;

console.log(formatWith(item, shortLabel));
console.log(formatWith(item, longLabel));
const starred = withSuffix(shortLabel, " ★");
console.log(formatWith(item, starred));
