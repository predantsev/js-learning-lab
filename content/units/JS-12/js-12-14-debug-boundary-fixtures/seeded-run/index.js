// Seven seeded defects, each run on a fixed input.
// No clock and no machine time zone: every result is the same on any computer.
const viewerZone = "America/New_York";

console.log("1 parseFloat:", parseFloat("1,5") + parseFloat("2,25"));
console.log("2 Number(''):", Number(""));
const price = Number("12,50");
console.log("3 typeof check:", price, typeof price === "number");

const nested = /^(\d+)+$/;
const started = performance.now();
const result = nested.test("1".repeat(22) + "x");
console.log("4 nested regex, 23 characters:", result, (performance.now() - started).toFixed(1), "ms");

console.log("5 unescaped query:", new RegExp("1.5").test("125"));

const day = new Intl.DateTimeFormat("en-US", { timeZone: viewerZone, dateStyle: "medium" });
console.log("6 calendar date in New York:", day.format(new Date("2026-03-01")));

const parts = new Date(2026, 3, 31);
console.log("7 new Date(2026, 3, 31):", parts.getFullYear(), parts.getMonth() + 1, parts.getDate());
