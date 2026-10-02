// Also valid: walk the own keys and read each value with brackets.
function printFields(record) {
  for (const key of Object.keys(record)) {
    console.log(key + ":", record[key]);
  }
}

const expense = {
  id: "e-03",
  label: "%%coffee%%",
  amountMinor: 18000,
  date: "2026-02-28",
  category: "fun",
};
printFields(expense);
