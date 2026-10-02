// Also valid: updateRecord and removeRecord reuse findIndexById and copy the slots around it.
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
    if (Object.hasOwn(input, field)) {
      record[field] = input[field];
    } else {
      record[field] = null;
    }
  }
  if (record.tags === null) {
    record.tags = [];
  } else {
    record.tags = [...record.tags];
  }
  return record;
}

function findIndexById(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (i in list && list[i].id === id) {
      return i;
    }
  }
  return -1;
}

// A dense copy of the list: holes are skipped.
function withoutHoles(list) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    if (i in list) {
      result.push(list[i]);
    }
  }
  return result;
}

function updateRecord(list, id, changes) {
  const result = withoutHoles(list);
  const index = findIndexById(result, id);
  if (index === -1) {
    return result;
  }
  const updated = { ...result[index] };
  for (const field of FIELDS) {
    if (Object.hasOwn(changes, field)) {
      updated[field] = field === "tags" ? [...changes[field]] : changes[field];
    }
  }
  result[index] = updated;
  return result;
}

function removeRecord(list, id) {
  const dense = withoutHoles(list);
  const result = [];
  for (const record of dense) {
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
