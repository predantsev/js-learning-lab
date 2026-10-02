// The rules of a habit: pure functions. No page and no storage here; the starting habits are in
// data/habits.json.

// The word for a frequency value.
export function frequencyText(frequency) {
  switch (frequency) {
    case "daily":
      return "%%daily%%";
    case "weekly":
      return "%%weekly%%";
    default:
      return "";
  }
}

// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.
export function formatHabitLabel(habit) {
  const label = habit.name + " · " + frequencyText(habit.frequency);
  if (habit.active === false) {
    return label + " · %%pausedMark%%";
  }
  return label;
}

// Checks a draft habit. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateHabit(input) {
  const errors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // The two known frequencies share one break; a missing frequency is "daily".
  const frequency = input.frequency ?? "daily";
  switch (frequency) {
    case "daily":
    case "weekly":
      break;
    default:
      errors.frequency = "unknown";
  }

  if (errors.name !== undefined || errors.frequency !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, frequency: frequency } };
}

// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.
// Every new habit gets its own, new completions array; the draft may also carry the active flag.
export function addHabit(list, id, input) {
  const check = validateHabit(input);
  if (!check.ok) {
    return list;
  }
  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };
  return [...list, habit];
}

// A new list in which the habit with this id is replaced by a copy with the changes;
// the other habits are the same objects.
export function updateHabit(list, id, changes) {
  const result = [];
  for (const habit of list) {
    if (habit.id === id) {
      result.push({ ...habit, ...changes });
    } else {
      result.push(habit);
    }
  }
  return result;
}

// A new list without the habit with this id.
export function removeHabit(list, id) {
  const result = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
    }
  }
  return result;
}

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// The days without repeats, in ascending order. A Set keeps every day once; "YYYY-MM-DD" text
// sorts in the same order as the dates.
export function uniqueSortedDays(days) {
  return [...new Set(days)].toSorted();
}

// A new list in which the habit with this id has the day in a NEW completions array. The dates
// stay unique and sorted, so an earlier day lands in its place. A day that is already there, or
// text that is not a calendar date, changes nothing.
export function completeHabit(list, id, day) {
  if (!isCalendarDate(day)) {
    return list;
  }
  const result = [];
  for (const habit of list) {
    if (habit.id !== id || habit.completions.includes(day)) {
      result.push(habit);
    } else {
      result.push({ ...habit, completions: uniqueSortedDays([...habit.completions, day]) });
    }
  }
  return result;
}

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text) {
  return text.normalize("NFC").trim().toLowerCase();
}

// The habits whose name contains the query; both sides are compared by their search key. An empty
// query keeps every habit.
export function searchHabits(list, query) {
  const wanted = searchKey(query);
  return list.filter((habit) => searchKey(habit.name).includes(wanted));
}

// The active ("active") or the paused ("paused") habits.
export function filterHabits(list, status) {
  const active = status === "active";
  return list.filter((habit) => habit.active === active);
}

// Comparator: alphabetical order of the names; equal names return 0 and keep their order.
function byName(a, b) {
  return a.name.localeCompare(b.name);
}

// A sorted copy; the received list keeps its order.
export function sortHabitsByName(list) {
  return list.toSorted(byName);
}

// On how many of the given days the habit was completed, and which share of the days that is.
// No days means no share: the rate is 0, not NaN.
export function summarizeHabit(habit, days) {
  const count = days.filter((day) => habit.completions.includes(day)).length;
  return { count: count, rate: days.length === 0 ? 0 : count / days.length };
}

// The names of the habits of a list, each with its completion rate over the days in percent.
export function formatRates(list, days) {
  let text = "";
  for (const habit of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + habit.name + " — " + summarizeHabit(habit, days).rate * 100 + "%";
  }
  return text;
}
// An index of the habits by id: a Map from id to habit, so a habit is found without a pass over the
// list. If two habits share an id, the first one stays in the index.
export function indexById(list) {
  const index = new Map();
  for (const habit of list) {
    if (!index.has(habit.id)) {
      index.set(habit.id, habit);
    }
  }
  return index;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate(items, size) {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}
