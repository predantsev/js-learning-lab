// The rules of a habit: pure functions with types. No page and no storage here; the starting
// habits are in data/habits.json. The types exist only for tsc: the platform and Node.js remove them
// before running, so a value that comes from outside (storage, a file) is still checked at runtime.

// ---------- types ----------

export type Frequency = "daily" | "weekly";

export type Habit = {
  readonly id: string;
  name: string;
  frequency: Frequency;
  active: boolean;
  completions: string[]; // calendar dates "YYYY-MM-DD", each once, in ascending order
};

// A draft from the form: every field may be missing, and a frequency is any text until it is checked.
export type HabitDraft = {
  name?: string;
  frequency?: string;
  active?: boolean;
};

export type HabitErrorKey = "required" | "too-long" | "unknown";

export type HabitErrors = {
  name?: HabitErrorKey;
  frequency?: HabitErrorKey;
};

// The result of validateHabit: exactly one of the two shapes; `ok` tells them apart.
export type ValidationResult =
  | { ok: true; value: { name: string; frequency: Frequency } }
  | { ok: false; errors: HabitErrors };

export type HabitStatus = "active" | "paused";

export type HabitSummary = { count: number; rate: number };

// ---------- rules ----------

// The word for a frequency value.
export function frequencyText(frequency: Frequency): string {
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
export function formatHabitLabel(habit: Habit): string {
  const label = habit.name + " · " + frequencyText(habit.frequency);
  if (habit.active === false) {
    return label + " · %%pausedMark%%";
  }
  return label;
}

// A type predicate: true only for the two known frequencies, and then tsc treats the text as a
// Frequency.
export function isFrequency(value: unknown): value is Frequency {
  return value === "daily" || value === "weekly";
}

// Checks a draft habit. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateHabit(input: HabitDraft): ValidationResult {
  const errors: HabitErrors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // A missing frequency is "daily"; any other text than the two frequencies is unknown.
  const frequency = input.frequency ?? "daily";
  if (!isFrequency(frequency)) {
    errors.frequency = "unknown";
  }

  // !isFrequency(frequency) is checked here again so that tsc knows the frequency below is a Frequency.
  if (errors.name !== undefined || !isFrequency(frequency)) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, frequency: frequency } };
}

// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.
// Every new habit gets its own, new completions array; the draft may also carry the active flag.
export function addHabit(list: Habit[], id: string, input: HabitDraft): Habit[] {
  const check = validateHabit(input);
  if (!check.ok) {
    return list;
  }
  const habit: Habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };
  return [...list, habit];
}

// A new list in which the habit with this id is replaced by a copy with the changes;
// the other habits are the same objects.
export function updateHabit(list: Habit[], id: string, changes: Partial<Omit<Habit, "id">>): Habit[] {
  const result: Habit[] = [];
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
export function removeHabit(list: Habit[], id: string): Habit[] {
  const result: Habit[] = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
    }
  }
  return result;
}

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// The days without repeats, in ascending order. A Set keeps every day once; "YYYY-MM-DD" text
// sorts in the same order as the dates.
export function uniqueSortedDays(days: readonly string[]): string[] {
  return sortBy([...new Set(days)], (day) => day);
}

// A generic sorted copy: the records in the order of the text that `key` gives for each, compared
// with localeCompare; records with the same key keep their order (the sort is stable). It works for
// habits, dates or any other records, and the result has the same type as the input.
export function sortBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  return items.toSorted((a, b) => key(a).localeCompare(key(b)));
}

// A new list in which the habit with this id has the day in a NEW completions array. The dates
// stay unique and sorted, so an earlier day lands in its place. A day that is already there, or
// text that is not a calendar date, changes nothing.
export function completeHabit(list: Habit[], id: string, day: string): Habit[] {
  if (!isCalendarDate(day)) {
    return list;
  }
  const result: Habit[] = [];
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
export function searchKey(text: string): string {
  return text.normalize("NFC").trim().toLowerCase();
}

// The habits whose name contains the query; both sides are compared by their search key. An empty
// query keeps every habit.
export function searchHabits(list: Habit[], query: string): Habit[] {
  const wanted = searchKey(query);
  return list.filter((habit) => searchKey(habit.name).includes(wanted));
}

// The active ("active") or the paused ("paused") habits.
export function filterHabits(list: Habit[], status: HabitStatus): Habit[] {
  const active = status === "active";
  return list.filter((habit) => habit.active === active);
}

// A copy in the alphabetical order of the names; equal names keep their order, and the received
// list keeps its order.
export function sortHabitsByName(list: Habit[]): Habit[] {
  return sortBy(list, (habit) => habit.name);
}

// On how many of the given days the habit was completed, and which share of the days that is.
// No days means no share: the rate is 0, not NaN.
export function summarizeHabit(habit: Habit, days: readonly string[]): HabitSummary {
  const count = days.filter((day) => habit.completions.includes(day)).length;
  return { count: count, rate: days.length === 0 ? 0 : count / days.length };
}

// The names of the habits of a list, each with its completion rate over the days in percent.
export function formatRates(list: Habit[], days: readonly string[]): string {
  let text = "";
  for (const habit of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + habit.name + " — " + summarizeHabit(habit, days).rate * 100 + "%";
  }
  return text;
}

// An index by id: a Map from id to record, so a record is found without a pass over the list. It
// is generic: it works for any records with a text id, and the Map keeps their type. If two
// records share an id, the first one stays in the index.
export function indexById<T extends { readonly id: string }>(list: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of list) {
    if (!index.has(item.id)) {
      index.set(item.id, item);
    }
  }
  return index;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}
