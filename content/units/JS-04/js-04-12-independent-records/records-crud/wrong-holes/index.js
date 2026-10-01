// Correct on dense lists, but every loop reads record.id without checking for a hole: sparse lists crash.
const FIELDS = [
  "label",
  "amountMinor",
  "date",
  "category",
  "tags",
];

function createRecord(id, input) {
  const record = { id };
  for (const field of FIELDS) {
    record[field] = Object.hasOwn(input, field) ? input[field] : null;
  }
  record.tags = Object.hasOwn(input, "tags") ? [...input.tags] : [];
  return record;
}

function findIndexById(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      return i;
    }
  }
  return -1;
}

function updateRecord(list, id, changes) {
  const result = [];
  for (const record of list) {
    if (record.id !== id) {
      result.push(record);
      continue;
    }
    const updated = { ...record };
    for (const field of FIELDS) {
      if (Object.hasOwn(changes, field)) {
        updated[field] =
          field === "tags" ? [...changes.tags] : changes[field];
      }
    }
    result.push(updated);
  }
  return result;
}

function removeRecord(list, id) {
  const result = [];
  for (const record of list) {
    if (record.id !== id) {
      result.push(record);
    }
  }
  return result;
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
