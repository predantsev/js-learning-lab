// Another valid approach: index loops with `in` for holes, Object.entries for the own fields
// of a change, and a small helper that checks whether a key is listed in FIELDS.
const FIELDS = [
  "label",
  "amountMinor",
  "date",
  "category",
  "tags",
];

function isKnown(key) {
  for (const field of FIELDS) {
    if (field === key) {
      return true;
    }
  }
  return false;
}

function createRecord(id, input) {
  const record = { id, label: null, amountMinor: null, date: null, category: null, tags: [] };
  for (const entry of Object.entries(input)) {
    const key = entry[0];
    if (isKnown(key)) {
      record[key] = key === "tags" ? [...entry[1]] : entry[1];
    }
  }
  return record;
}

function findIndexById(list, id) {
  let i = 0;
  while (i < list.length) {
    if (i in list && list[i].id === id) {
      return i;
    }
    i++;
  }
  return -1;
}

function updateRecord(list, id, changes) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (!(i in list)) {
      continue;
    }
    const record = list[i];
    if (record.id !== id) {
      result.push(record);
      continue;
    }
    const { tags, ...rest } = record;
    const updated = { ...rest, tags };
    for (const entry of Object.entries(changes)) {
      const key = entry[0];
      if (isKnown(key)) {
        updated[key] = key === "tags" ? [...entry[1]] : entry[1];
      }
    }
    result.push(updated);
  }
  return result;
}

function removeRecord(list, id) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (i in list && list[i].id !== id) {
      result.push(list[i]);
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
