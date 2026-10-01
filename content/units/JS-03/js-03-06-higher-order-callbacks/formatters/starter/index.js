const item = { name: "%%headphones%%", price: 80 };

// 1. formatWith(record, formatter): call formatter with the record and return its result.
function formatWith(record, formatter) {}

// 2. shortLabel(record) returns only the name: "%%headphones%%".
const shortLabel = (record) => "";

// 3. longLabel(record) returns the name and the price: "%%headphones%% — 80 %%uah%%".
const longLabel = (record) => "";

// 4. withSuffix(formatter, suffix) returns a NEW formatter that adds suffix to formatter's result.
function withSuffix(formatter, suffix) {}

console.log(formatWith(item, shortLabel));
console.log(formatWith(item, longLabel));
const starred = withSuffix(shortLabel, " ★");
console.log(formatWith(item, starred));
