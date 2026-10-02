// labelsOf(expenses): the trimmed labels of all expenses.
function labelsOf(expenses) {
  const labels = [];
  for (const expense of expenses) {
    try {
      labels.push(expense.label.trim());
    } catch (error) {
    }
  }
  return labels;
}

// exportAll(expenses): the expenses as JSON text for a file.
function exportAll(expenses) {
  try {
    return JSON.stringify({ schemaVersion: 1, records: expenses });
  } finally {
    return "exported";
  }
}

// loadAll(text): the expenses from exported JSON text.
function loadAll(text) {
  return JSON.parse(text).records;
}

const expenses = [
  { id: "e-01", label: " %%groceries%% ", amountMinor: 84550 },
  { id: "e-08", amountMinor: 900 },
  { id: "e-04", label: "%%bulbs%%", amountMinor: 9990 },
];

console.log(labelsOf(expenses));
const text = exportAll(expenses);
console.log(text);
console.log(loadAll(text).length);
