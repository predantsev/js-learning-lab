// The label of e-03 was pasted from another program: one of its letters is stored
// as a base letter plus a separate combining mark. On screen it looks the same.
const expenses = [
  { id: "e-01", label: "%%groceries%%" },
  { id: "e-02", label: "%%teaTyped%%" },
  { id: "e-03", label: "%%teaPasted%%" },
  { id: "e-04", label: "%%coffee%%" },
];

const query = "%%query%%";

const found = expenses.filter((expense) =>
  expense.label.toLowerCase().includes(query.toLowerCase())
);

console.log("%%foundLabel%%", found.length);
for (const expense of found) {
  console.log(expense.id, expense.label);
}
