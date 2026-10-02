// validateRecord(habit): { ok: true, value } or { ok: false, errors }.
function validateRecord(habit) {
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
function summarize(habits) {
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

export function render(habits) {
  const valid = habits.filter((habit) => validateRecord(habit).ok);
  const summary = summarize(valid);
  document.querySelector("#summary").textContent =
    "%%activeText%%" + summary.active + " / " + summary.count + " · %%completionsText%%" + summary.completions;
  const list = document.querySelector("#habits");
  list.replaceChildren();
  for (const habit of habits) {
    const item = document.createElement("li");
    item.textContent = validateRecord(habit).ok ? habit.name : "%%invalid%%" + habit.id;
    list.append(item);
  }
}
