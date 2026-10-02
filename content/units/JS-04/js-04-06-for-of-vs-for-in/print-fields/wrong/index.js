// for…in also walks keys inherited from another object, so shared defaults get printed too.
function printFields(record) {
  for (const key in record) {
    console.log(key + ": " + record[key]);
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
