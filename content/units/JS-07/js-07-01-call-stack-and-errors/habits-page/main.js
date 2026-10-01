// Prints the whole stack trace of every error that no code handled.
window.addEventListener("error", (event) => {
  console.log(event.error.stack);
});

function lastDone(habit) {
  const count = habit.completions.length;
  if (count === 0) {
    return "%%never%%";
  }
  return habit.completions[count - 1];
}

function formatHabit(habit) {
  return habit.name + " — " + lastDone(habit);
}

function render(habits) {
  const list = document.querySelector("#habits");
  for (const habit of habits) {
    const item = document.createElement("li");
    item.textContent = formatHabit(habit);
    list.append(item);
  }
}

const habits = [
  { id: "h-01", name: "%%exercise%%", completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-06", name: "%%walk%%", completions: [] },
  { id: "h-07", name: "%%stretch%%", completion: ["2026-03-01"] },
  { id: "h-03", name: "%%water%%", completions: ["2026-03-01"] },
];

document.querySelector("#count").addEventListener("click", () => {
  document.querySelector("#status").textContent = "%%countText%%" + habits.length;
});

render(habits);
console.log("%%renderedAll%%");
