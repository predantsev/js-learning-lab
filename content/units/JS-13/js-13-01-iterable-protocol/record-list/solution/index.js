// A list of expense records that keeps its array private.
class RecordList {
  #records;

  constructor(records) {
    this.#records = [...records];
  }

  add(record) {
    this.#records.push(record);
  }

  // Make the list iterable: for...of, spread and Array.from
  // must receive the records one by one, in order.
  [Symbol.iterator]() {
    const records = this.#records;
    let index = 0;
    return {
      next() {
        if (index < records.length) {
          const value = records[index];
          index = index + 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const list = new RecordList([
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
]);
list.add({ id: "e-03", label: "%%coffee%%", amountMinor: 18000 });

for (const expense of list) {
  console.log(expense.label);
}
console.log([...list].length);
