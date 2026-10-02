// Prints each [name, value] pair as an array instead of "name: value".
function printFields(record) {
  for (const entry of Object.entries(record)) {
    console.log(entry);
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
