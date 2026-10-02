// The outer declaration was deleted instead of the inner one: after the loop total does not exist.
const fare = 800;
for (let day = 1; day <= 7; day++) {
  let total = 0;
  total = total + fare;
  console.log("%%day%%", day, total);
}
console.log("%%week%%", total);
