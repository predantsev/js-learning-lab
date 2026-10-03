// A fake server: loadHabits() answers after 300 ms. setNextOutcome decides how the next load ends.
const HABITS = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily" },
  { id: "h-02", name: "%%reading%%", frequency: "daily" },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly" },
];
let nextOutcome = "ok";

export function setNextOutcome(outcome) {
  nextOutcome = outcome; // "ok" | "empty" | "fail"
}

export function loadHabits() {
  const outcome = nextOutcome;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (outcome === "fail") reject(new Error("%%serverDown%%"));
      else resolve(outcome === "empty" ? [] : HABITS.map((habit) => ({ ...habit })));
    }, 300);
  });
}
