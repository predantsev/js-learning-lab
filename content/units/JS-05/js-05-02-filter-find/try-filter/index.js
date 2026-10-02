const items = [
  { id: "w-01", name: "%%headphones%%", price: 80 },
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-03", name: "%%bicycle%%", price: 240 },
];

const limit = 100;
const affordable = items.filter((item) => item.price <= limit);

console.log(affordable.map((item) => item.name));
console.log(affordable.length + " %%of%% " + items.length);
