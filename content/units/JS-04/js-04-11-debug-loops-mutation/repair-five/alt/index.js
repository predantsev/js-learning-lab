// Also valid repairs: a labeled break, an own-key check inside for…in and an index-based update.
const habitDefaults = { frequency: "daily", active: true };

// A habit that inherits frequency and active from habitDefaults.
function makeHabit(id, name) {
  const habit = Object.create(habitDefaults);
  habit.id = id;
  habit.name = name;
  habit.completions = [];
  return habit;
}

// The habit with this id, or null.
function findHabit(habits, id) {
  for (let i = 0; i < habits.length; i++) {
    if (habits[i].id === id) {
      return habits[i];
    }
  }
  return null;
}

// The first habit (list order) completed on the given day, or null.
function firstDoneOn(habits, day) {
  let found = null;
  search: for (let h = 0; h < habits.length; h++) {
    for (let d = 0; d < habits[h].completions.length; d++) {
      if (habits[h].completions[d] === day) {
        found = habits[h];
        break search;
      }
    }
  }
  return found;
}

// The last completion date of every habit
// (null for a habit with no completions).
function lastDays(habits) {
  const result = [];
  for (const habit of habits) {
    const days = habit.completions;
    result.push(days.length === 0 ? null : days[days.length - 1]);
  }
  return result;
}

// The names of the record's own fields.
function fieldNames(record) {
  const names = [];
  for (const key in record) {
    if (Object.hasOwn(record, key)) {
      names.push(key);
    }
  }
  return names;
}

// A new list where the habit with this id has the changes merged in.
function updateHabit(habits, id, changes) {
  const result = [...habits];
  for (let i = 0; i < result.length; i++) {
    if (result[i].id === id) {
      result[i] = { ...result[i], ...changes };
    }
  }
  return result;
}

// ---- fixtures: several habits, one made by makeHabit, empty ----
const habits = [
  {
    id: "h-01",
    name: "%%exercise%%",
    frequency: "daily",
    active: true,
    completions: ["2026-02-27", "2026-02-28", "2026-03-01"],
  },
  {
    id: "h-02",
    name: "%%reading%%",
    frequency: "daily",
    active: true,
    completions: ["2026-02-26", "2026-02-28", "2026-03-01"],
  },
  {
    id: "h-06",
    name: "%%walk%%",
    frequency: "daily",
    active: true,
    completions: [],
  },
];
const one = [makeHabit("h-07", "%%stretch%%")];
const empty = [];

const h02 = findHabit(habits, "h-02");
console.log("findHabit(habits, \"h-02\"):", h02?.id);
const firstDone = firstDoneOn(habits, "2026-03-01");
console.log("firstDoneOn(habits, \"2026-03-01\"):", firstDone?.id);
console.log("lastDays(habits):", lastDays(habits));
console.log("fieldNames(habits[0]):", fieldNames(habits[0]));
console.log("fieldNames(one[0]):", fieldNames(one[0]));
const paused = updateHabit(habits, "h-02", { active: false });
console.log("habits[1].active after updateHabit:", habits[1].active);
console.log("findHabit(empty, \"h-01\"):", findHabit(empty, "h-01"));
