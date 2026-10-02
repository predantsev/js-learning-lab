const KEY = "jsll.habits.v1";
const BACKUP_KEY = "jsll.habits.v1.backup";

// The empty catch now prints the error, but still swallows it: the count stays quietly wrong.
function countDoneOn(habits, day) {
  let count = 0;
  for (const habit of habits) {
    try {
      if (habit.completions.includes(day)) {
        count = count + 1;
      }
    } catch (error) {
      console.log(error.message);
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
    storage.setItem(BACKUP_KEY, text);
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
