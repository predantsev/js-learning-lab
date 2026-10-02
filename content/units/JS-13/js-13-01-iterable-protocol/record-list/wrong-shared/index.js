// A list of expense records that keeps its array private.
class RecordList {
  #records;
  #iterator;

  constructor(records) {
    this.#records = [...records];
    this.#iterator = this.#records[Symbol.iterator]();
  }

  add(record) {
    this.#records.push(record);
  }

  // Make the list iterable: for...of, spread and Array.from
  // must receive the records one by one, in order.
  [Symbol.iterator]() {
    return this.#iterator;
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
