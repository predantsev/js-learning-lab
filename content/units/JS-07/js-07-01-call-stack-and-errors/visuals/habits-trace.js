function lastDone(habit) {
  const count = habit.completions.length;
  return habit.completions[count - 1];
}

function formatHabit(habit) {
  const day = lastDone(habit);
  return habit.id + ": " + day;
}

function render(habits) {
  for (const habit of habits) {
    console.log(formatHabit(habit));
  }
}

render([
  { id: "h-03", completions: ["2026-03-01"] },
  { id: "h-07", completion: ["2026-03-01"] },
]);
console.log("done");
