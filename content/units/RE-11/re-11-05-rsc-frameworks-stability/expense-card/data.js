// Stands in for the data source. In an RSC framework a Server Component could read a database here;
// in the browser it is only a pretend request that answers after 150 ms.
const EXPENSES = {
  "e-01": { id: "e-01", label: "%%groceries%%", amountMinor: 84550, category: "food" },
};

export function loadExpense(id) {
  return new Promise((resolve) => setTimeout(() => resolve(EXPENSES[id]), 150));
}
