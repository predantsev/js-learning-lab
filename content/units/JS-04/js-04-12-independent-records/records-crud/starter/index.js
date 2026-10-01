// Fields an expense may carry besides its id.
const FIELDS = [
  "label",
  "amountMinor",
  "date",
  "category",
  "tags",
];

function createRecord(id, input) {
}

function findIndexById(list, id) {
}

function updateRecord(list, id, changes) {
}

function removeRecord(list, id) {
}

const expenses = [
  {
    id: "e-01",
    label: "%%groceries%%",
    amountMinor: 84550,
    date: "2026-03-01",
    category: "food",
    tags: ["%%tagWeekly%%"],
  },
  {
    id: "e-03",
    label: "%%coffee%%",
    amountMinor: 18000,
    date: "2026-02-28",
    category: "fun",
    tags: [],
  },
];
const lunch = createRecord("e-06", {
  label: "%%lunch%%",
  amountMinor: 21050,
  date: "2026-03-02",
  category: "food",
});
console.log(lunch);
console.log(findIndexById(expenses, "e-03"));
console.log(updateRecord(expenses, "e-03", { amountMinor: 20000 }));
console.log(removeRecord(expenses, "e-01"));
