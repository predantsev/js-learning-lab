// The project script. It runs after the page has loaded.
// The rules of a habit live in pure functions: they get data and return a result.
// The lines at the end only call them and write the results onto the page.
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

// Two habits of the list and a draft of a new one, as a form will send it later.
// The completion dates (a list) come in JS-04.
const firstHabit = { id: "h-01", name: "%%nameValue%%", frequency: "daily", active: true };
const secondHabit = { id: "h-04", name: "%%secondName%%", frequency: "weekly", active: true };
const draft = { name: "", frequency: "monthly" };

// The page only calls the functions and shows what they return.
const draftCheck = validateHabit(draft);
document.querySelector("#first-label").textContent = formatHabitLabel(firstHabit);
document.querySelector("#second-label").textContent = formatHabitLabel(secondHabit);
document.querySelector("#name-message").textContent = messageFor(draftCheck.errors?.name);
document.querySelector("#frequency-message").textContent = messageFor(draftCheck.errors?.frequency);
