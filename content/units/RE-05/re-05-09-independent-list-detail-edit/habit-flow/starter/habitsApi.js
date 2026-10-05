// A fake server: loadHabits() answers after 300 ms. setNextOutcome decides how the next load ends.
const HABITS = [
  { id: "h-01", name: "%%exercise%%", frequency: "daily" },
  { id: "h-02", name: "%%reading%%", frequency: "daily" },
  { id: "h-04", name: "%%tidy%%", frequency: "weekly" },
];
let nextOutcome = "ok";
let held = null; // for the checks: while set, answers wait here instead of on a 300 ms timer

export function setNextOutcome(outcome) {
  nextOutcome = outcome; // "ok" | "empty" | "fail"
}

export function loadHabits() {
  const outcome = nextOutcome;
  return new Promise((resolve, reject) => {
    const answer = () => {
      if (outcome === "fail") reject(new Error("%%serverDown%%"));
      else resolve(outcome === "empty" ? [] : HABITS.map((habit) => ({ ...habit })));
    };
    if (held !== null) held.push(answer);
    else setTimeout(answer, 300);
  });
}

// For the checks: hold every answer until answerNow(), so no check depends on the computer's speed.
export function holdAnswers() {
  held = [];
  return {
    answerNow: () => held.splice(0).forEach((answer) => answer()),
    release() {
      const waiting = held;
      held = null;
      waiting.forEach((answer) => answer());
    },
  };
}
