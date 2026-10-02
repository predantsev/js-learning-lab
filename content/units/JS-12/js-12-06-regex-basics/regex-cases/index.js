// Which inputs does each pattern accept?
const datePattern = /\d{4}-\d{2}-\d{2}/;
const namePattern = /\w+/;

const dates = ["2026-03-01", "x2026-03-01y", "2026-3-1", "12026-03-011"];
for (const text of dates) {
  console.log("%%date%%", JSON.stringify(text), "→", datePattern.test(text));
}

const names = ["Lamp", "Київ", "Лампа 2", "w-01"];
for (const text of names) {
  console.log("%%name%%", JSON.stringify(text), "→", namePattern.test(text));
}
