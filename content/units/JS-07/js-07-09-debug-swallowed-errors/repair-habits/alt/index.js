const KEY = "jsll.habits.v1";
const BACKUP_KEY = "jsll.habits.v1.backup";

// countDoneOn(habits, day): how many habits were done on that day.
function countDoneOn(habits, day) {
  let count = 0;
  for (const habit of habits) {
    let done;
    try {
      done = habit.completions.includes(day);
    } catch (error) {
      throw new TypeError("cannot read the completions of " + habit.id, { cause: error });
    }
    if (done) {
      count = count + 1;
    }
  }
  return count;
}

// saveHabits(storage, habits): try/finally may stay, as long as finally does not return.
function saveHabits(storage, habits) {
  let saving = true;
  try {
    storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: habits }));
    return { ok: true, count: habits.length };
  } finally {
    saving = false;
  }
}

// loadHabits(storage): the parsed value kept in a variable before reading records.
function loadHabits(storage) {
  const text = storage.getItem(KEY);
  if (text === null) {
    return [];
  }
  let saved;
  try {
    saved = JSON.parse(text);
  } catch (error) {
    storage.setItem(BACKUP_KEY, text);
    throw new Error("the stored habits are not valid JSON", { cause: error });
  }
  return saved.records;
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
