// Transit spending for one week: every day costs one fare.
// After each day the console shows the running total, then the week total.
const fare = 800;   // minor units (8.00)
let total = 0;
for (let day = 1; day <= 7; day++) {
  let total = 0;
  total = total + fare;
  console.log("%%day%%", day, total);
}
console.log("%%week%%", total);
