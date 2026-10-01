const habits = [
  { id: "h-01", active: true },
  { id: "h-05", active: false },
  { id: "h-06", active: true },
];
const isPaused = (habit) => !habit.active;
const isActive = (habit) => habit.active;

const anyPaused = habits.some(isPaused);
const allActive = habits.every(isActive);

const none = [];
const noneSome = none.some(isPaused);
const noneEvery = none.every(isActive);

console.log(anyPaused, allActive, noneSome, noneEvery);
