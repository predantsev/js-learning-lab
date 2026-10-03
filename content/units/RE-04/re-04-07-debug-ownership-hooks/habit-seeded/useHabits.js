import { useState } from "react";

const TODAY = "2026-03-02";

const START = [
  { id: "h-01", name: "%%exercise%%", completions: ["2026-03-01"] },
  { id: "h-02", name: "%%reading%%", completions: [] },
  { id: "h-03", name: "%%water%%", completions: ["2026-02-28", "2026-03-01"] },
];

// Contract of useHabits()
// - Returns { habits, addHabit, completeToday }.
// - addHabit(name) adds a habit with that name and no completions at the end of the list.
// - completeToday(id) adds today's date to that habit's completions ONCE:
//   calling it again on the same day changes nothing.
// - Every call owns its own list.
export function useHabits() {
  const [habits, setHabits] = useState(START);

  function addHabit(name) {
    setHabits([...habits, { id: `h-${Date.now()}`, name: name, completions: [] }]);
  }

  function completeToday(id) {
    setHabits(habits.map((habit) => (habit.id === id ? { ...habit, completions: [...habit.completions, TODAY] } : habit)));
  }

  return { habits, addHabit, completeToday };
}

// A small custom hook: an open/closed flag.
export function useToggle(initial) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn(!on)];
}
