// toMinor(text) turns "845.50" into 84550 (minor units); it throws for text it cannot read.
function toMinor(text) {
  const amount = Number(text);
  if (Number.isNaN(amount)) {
    throw new TypeError("not a number: " + text);
  }
  return Math.round(amount * 100);
}

// importExpense knows WHICH expense failed; toMinor only knows WHY.
function importExpense(row) {
  try {
    return { id: row.id, label: row.label, amountMinor: toMinor(row.amount) };
  } catch (error) {
    throw new Error("expense " + row.id + " cannot be imported", { cause: error });
  }
}

// importAll skips a broken row and goes on with the next one.
function importAll(rows) {
  const imported = [];
  for (const row of rows) {
    try {
      imported.push(importExpense(row));
    } catch (error) {
      console.log(error.message);
      console.log(error.cause);
    }
  }
  return imported;
}

const result = importAll([
  { id: "e-01", label: "%%groceries%%", amount: "845.50" },
  { id: "e-09", label: "%%gift%%", amount: "%%lots%%" },
  { id: "e-04", label: "%%bulbs%%", amount: "99.90" },
]);
console.log("%%imported%%" + result.length);
