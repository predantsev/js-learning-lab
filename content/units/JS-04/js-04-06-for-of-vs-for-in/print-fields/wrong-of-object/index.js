// for…of needs an array: an ordinary object throws "record is not iterable".
function printFields(record) {
  for (const field of record) {
    console.log(field);
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
