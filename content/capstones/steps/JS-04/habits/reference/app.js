// The project script. It runs after the page has loaded.
// The rules of a habit live in pure functions: they get data and return a result.
// The list functions return new arrays and never change the list, the habits or their
// completions arrays they receive. The lines at the end only call them and write the results
// onto the page.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// The word for a frequency value.
function frequencyText(frequency) {
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
function formatHabitLabel(habit) {
  const label = habit.name + " · " + frequencyText(habit.frequency);
  if (habit.active === false) {
    return label + " · %%pausedMark%%";
  }
  return label;
}

// Checks a draft habit. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateHabit(input) {
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

// The text the page shows for an error key; no key means no message.
function messageFor(errorKey) {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "unknown":
      return "%%invalidMessage%%";
    default:
      return "";
  }
}

// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.
// Every new habit gets its own, new completions array.
function addHabit(list, id, input) {
  const check = validateHabit(input);
  if (!check.ok) {
    return list;
  }
  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: true, completions: [] };
  return [...list, habit];
}

// A new list in which the habit with this id is replaced by a copy with the changes;
// the other habits are the same objects.
function updateHabit(list, id, changes) {
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
function removeHabit(list, id) {
  const result = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
    }
  }
  return result;
}

// A new list in which the habit with this id has the day in a NEW completions array.
// Assumption: the day is today, never earlier than the stored dates, so adding it
// at the end keeps the dates in ascending order. A day that is already there is not added again.
function completeHabit(list, id, day) {
  const result = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
      continue;
    }
    let alreadyDone = false;
    for (const date of habit.completions) {
      if (date === day) {
        alreadyDone = true;
        break;
      }
    }
    if (alreadyDone) {
      result.push(habit);
    } else {
      result.push({ ...habit, completions: [...habit.completions, day] });
    }
  }
  return result;
}

// The labels of all habits of a list as one text.
function formatList(list) {
  let text = "";
  for (const habit of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + formatHabitLabel(habit);
  }
  return text;
}

// The habits of the list and a draft of a new one, as a form will send it later.
const habits = [
  { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-02", name: "%%fixture2Name%%", frequency: "daily", active: true, completions: ["2026-02-26", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] },
  { id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: true, completions: ["2026-02-22", "2026-03-01"] },
  { id: "h-05", name: "%%fixture5Name%%", frequency: "daily", active: false, completions: ["2026-02-20"] },
  { id: "h-06", name: "%%fixture6Name%%", frequency: "daily", active: true, completions: [] },
];
const draft = { name: "", frequency: "monthly" };

// Four changes, each giving a new list; habits itself stays as it was.
const withNewHabit = addHabit(habits, "h-07", { name: "%%newName%%", frequency: "daily" });
const withPaused = updateHabit(withNewHabit, "h-02", { active: false });
const withCompleted = completeHabit(withPaused, "h-03", "2026-03-02");
const changed = removeHabit(withCompleted, "h-06");

// The page only calls the functions and shows what they return.
const draftCheck = validateHabit(draft);
document.querySelector("#list-before").textContent = formatList(habits);
document.querySelector("#list-after").textContent = formatList(changed);
document.querySelector("#name-message").textContent = messageFor(draftCheck.errors?.name);
document.querySelector("#frequency-message").textContent = messageFor(draftCheck.errors?.frequency);
