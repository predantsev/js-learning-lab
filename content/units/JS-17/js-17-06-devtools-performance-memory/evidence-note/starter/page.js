// The page to profile. Read-only: write what you measured in evidence.js.
export const HABIT_COUNT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_DAY = Date.UTC(2023, 0, 1);
const DAYS = 3 * 365;
const dayAt = (i) => new Date(FIRST_DAY + i * DAY_MS).toISOString().slice(0, 10);
const allDays = Array.from({ length: DAYS }, (_, i) => dayAt(i));

// Synthetic habits with about three years of completions each.
function makeHabits(count) {
  const habits = [];
  for (let h = 0; h < count; h++) {
    const completions = allDays.filter((_, i) => (i * 7 + h) % 10 < 6);
    habits.push({ id: "h-" + h, name: "%%habit%% " + (h + 1), completions });
  }
  return habits;
}
const habits = makeHabits(HABIT_COUNT);

// The share of the given days on which the habit was completed.
function completionRate(habit, days) {
  let done = 0;
  for (const day of days) {
    if (habit.completions.includes(day)) done = done + 1;
  }
  return done / days.length;
}

function renderRates(list) {
  const items = list.map((habit) => {
    const item = document.createElement("li");
    item.textContent = `${habit.name}: ${Math.round(completionRate(habit, allDays) * 100)}%`;
    return item;
  });
  document.querySelector("#rates").replaceChildren(...items);
}

document.querySelector("#recalculate").addEventListener("click", () => {
  const start = performance.now();
  renderRates(habits);
  document.querySelector("#status").textContent = `${HABIT_COUNT} %%habits%% · ${(performance.now() - start).toFixed(0)} ms`;
});
