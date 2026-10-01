// The inner declaration is gone; += updates the one outer total.
const fare = 800;
let total = 0;
for (let day = 1; day <= 7; day++) {
  total += fare;
  console.log("%%day%%", day, total);
}
console.log("%%week%%", total);
