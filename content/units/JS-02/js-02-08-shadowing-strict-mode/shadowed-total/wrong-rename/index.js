// Renaming the inner binding removes the shadowing, but it still restarts from zero every day.
const fare = 800;
let total = 0;
for (let day = 1; day <= 7; day++) {
  let dayTotal = 0;
  dayTotal = dayTotal + fare;
  console.log("%%day%%", day, dayTotal);
}
console.log("%%week%%", total);
