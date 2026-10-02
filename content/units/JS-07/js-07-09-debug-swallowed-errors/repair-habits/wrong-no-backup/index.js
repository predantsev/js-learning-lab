const KEY = "jsll.habits.v1";
const BACKUP_KEY = "jsll.habits.v1.backup";

// loadHabits reports the problem with a cause but does not keep the unreadable text.
function countDoneOn(habits, day) {
  let count = 0;
  for (const habit of habits) {
    try {
      if (habit.completions.includes(day)) {
        count = count + 1;
      }
    } catch (error) {
      throw new Error("habit " + habit.id + " cannot be counted", { cause: error });
    }
  }
  return count;
}

function saveHabits(storage, habits) {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: habits }));
  return { ok: true, count: habits.length };
}

function loadHabits(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return [];
  }
  try {
    return JSON.parse(text).records;
  } catch (error) {
    throw new Error("saved habits cannot be read", { cause: error });
  }
}

// The day report — not part of the defects.
const today = "2026-03-01";
const habits = [
  { id: "h-01", name: "%%exercise%%", completions: ["2026-02-28", "2026-03-01"] },
  { id: "h-02", name: "%%read%%", completions: ["2026-02-28"] },
  { id: "h-03", name: "%%water%%", completions: ["2026-03-01"] },
];
console.log(saveHabits(localStorage, habits));
console.log("%%doneToday%%" + countDoneOn(loadHabits(localStorage), today));
