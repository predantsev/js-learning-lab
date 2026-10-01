// An immutable update: a new list, a new record for the
// changed one, and the others reused.
function setPrice(list, id, price) {
  const result = [];
  for (const record of list) {
    if (record.id === id) {
      result.push({ ...record, price });
    } else {
      result.push(record);
    }
  }
  return result;
}

const wishes = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-03", name: "%%bicycle%%", price: 240 },
];
const updated = setPrice(wishes, "w-02", 50);
console.log("updated === wishes:", updated === wishes);
console.log("updated[0] === wishes[0]:", updated[0] === wishes[0]);
console.log("updated[1] === wishes[1]:", updated[1] === wishes[1]);
console.log("wishes[1].price:", wishes[1].price);
console.log("updated[1].price:", updated[1].price);
