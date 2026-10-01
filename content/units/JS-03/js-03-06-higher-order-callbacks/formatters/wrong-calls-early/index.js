const item = { name: "%%headphones%%", price: 80 };

function formatWith(record, formatter) {
  return formatter(record);
}

const shortLabel = (record) => record.name;

const longLabel = (record) => record.name + " — " + record.price + " %%uah%%";

// withSuffix calls the formatter right away (with the top-level item) and keeps only the text,
// so the "new formatter" ignores the record it receives.
function withSuffix(formatter, suffix) {
  const text = formatter(item) + suffix;
  return (record) => text;
}

console.log(formatWith(item, shortLabel));
console.log(formatWith(item, longLabel));
const starred = withSuffix(shortLabel, " ★");
console.log(formatWith(item, starred));
