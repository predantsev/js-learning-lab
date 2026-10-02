// Print every OWN field of the record as "name: value",
// one line per field, in order.
function printFields(record) {
  for (const entry of Object.entries(record)) {
    console.log(entry[0] + ": " + entry[1]);
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
