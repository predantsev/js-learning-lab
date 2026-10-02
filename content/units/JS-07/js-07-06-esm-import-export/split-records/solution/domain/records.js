// The rules of the habit tracker: pure functions only — no DOM, no storage.

// validateRecord(habit): { ok: true, value } or { ok: false, errors }.
export function validateRecord(habit) {
  const errors = {};
  if (typeof habit.name !== "string" || habit.name.trim() === "") {
    errors.name = "required";
  }
  if (habit.frequency !== "daily" && habit.frequency !== "weekly") {
    errors.frequency = "unknown";
  }
  const hasErrors = errors.name !== undefined || errors.frequency !== undefined;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: habit };
}

// summarize(habits): how many habits there are, how many are active, how many completions in total.
export function summarize(habits) {
  let active = 0;
  let completions = 0;
  for (const habit of habits) {
    if (habit.active) {
      active = active + 1;
    }
    completions = completions + habit.completions.length;
  }
  return { count: habits.length, active: active, completions: completions };
}
