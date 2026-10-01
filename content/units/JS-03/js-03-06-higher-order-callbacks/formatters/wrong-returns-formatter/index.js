const item = { name: "%%headphones%%", price: 80 };

// formatWith hands back the formatter itself instead of calling it.
function formatWith(record, formatter) {
  return formatter;
}

const shortLabel = (record) => record.name;

const longLabel = (record) => record.name + " — " + record.price + " %%uah%%";

function withSuffix(formatter, suffix) {
  return (record) => formatter(record) + suffix;
}

console.log(formatWith(item, shortLabel));
console.log(formatWith(item, longLabel));
const starred = withSuffix(shortLabel, " ★");
console.log(formatWith(item, starred));
