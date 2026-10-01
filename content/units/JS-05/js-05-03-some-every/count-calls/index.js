const habits = [
  { id: "h-01", name: "%%exercise%%", active: true },
  { id: "h-05", name: "%%english%%", active: false },
  { id: "h-06", name: "%%walk%%", active: true },
];

let calls = 0;
const isPaused = (habit) => {
  calls = calls + 1;
  console.log("%%checking%%", habit.name);
  return !habit.active;
};

const anyPaused = habits.some(isPaused);
console.log("some:", anyPaused, "%%calls%%", calls);
