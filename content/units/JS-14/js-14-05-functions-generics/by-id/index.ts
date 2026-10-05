function byId<T extends { id: string }>(items: readonly T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

const wishes = [
  { id: "w-02", name: "%%lamp%%", price: 45 },
  { id: "w-04", name: "%%book%%", price: 25 },
];
const habits = [
  { id: "h-03", name: "%%water%%", completions: ["2026-03-01"] },
];

const lamp = byId(wishes, "w-02");
console.log(lamp?.name, lamp?.price);

const water = byId(habits, "h-03");
console.log(water?.completions.length);

console.log(byId(wishes, "w-99"));
