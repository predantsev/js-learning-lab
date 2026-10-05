import { useState } from "react";
import { completeHabit } from "../domain/habits";
import type { Habit } from "../domain/types";
import { loadHabits } from "../storage/habitStorage";

const START: Habit[] = [
  { id: "h-01", name: "%%exercise%%", completions: ["2026-02-28"] },
  { id: "h-03", name: "%%water%%", completions: [] },
];

// The data hook of the web app: React state plus the storage adapter.
export function useHabits(): { habits: Habit[]; complete: (id: string, date: string) => void } {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits(START));

  function complete(id: string, date: string) {
    const next = completeHabit(habits, id, date);
    setHabits(next);
  }

  return { habits, complete };
}
