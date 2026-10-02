import { type Wish, validateItem } from "./wish.ts";

// What localStorage might really hold after an old version or a manual edit.
const stored = JSON.stringify([
  { id: "w-01", name: "%%headphones%%", price: "80", acquired: false, category: null },
  { id: "w-02", name: "%%lamp%%", price: 45, acquired: false, category: "%%home%%" },
  { id: "w-03", name: "%%bike%%", price: 240, acquired: "no", category: null },
]);

// Lane 1: a cast. tsc is satisfied, nothing is checked.
const cast = JSON.parse(stored) as Wish[];
const castTotal = cast.reduce((sum, wish) => sum + (wish.price ?? 0), 0);
console.log("as Wish[] →", castTotal);

// Lane 2: unknown + runtime validation, record by record.
const parsed: unknown = JSON.parse(stored);
const records = Array.isArray(parsed) ? parsed : [];
for (const record of records) {
  const result = validateItem(record);
  console.log(result.ok ? `ok: ${result.value.id}` : `rejected: ${Object.keys(result.errors).join(", ")}`);
}
