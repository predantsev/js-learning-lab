const expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

// Finds an expense after a short wait; rejects when there is no such id.
function findExpense(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = expenses.find((expense) => expense.id === id);
      if (found) {
        resolve(found);
      } else {
        reject(new Error("%%notFound%% " + id));
      }
    }, 300);
  });
}

findExpense("e-07")
  .then((expense) => {
    console.log("%%found%%", expense.label);
    return expense.amountMinor / 100;
  })
  .catch((error) => {
    console.log("%%caught%%", error.message);
    return 0;
  })
  .then((amount) => console.log("%%amount%%", amount))
  .finally(() => console.log("%%loadingOff%%"));
