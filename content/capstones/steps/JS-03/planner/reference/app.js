// The project script. It runs after the page has loaded.
// The rules of a task live in pure functions: they get data and return a result.
// The lines at the end only call them and write the results onto the page.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// The word for a priority value.
function priorityText(priority) {
  switch (priority) {
    case "low":
      return "%%priorityLow%%";
    case "normal":
      return "%%priorityNormal%%";
    case "high":
      return "%%priorityHigh%%";
    default:
      return "";
  }
}

// The label of a task: the title, the due date (or a fallback text) in brackets and the priority in words.
function formatTaskLabel(task) {
  return task.title + " (" + (task.dueDate ?? "%%noDueDate%%") + ") · " + priorityText(task.priority);
}

// Checks a draft task. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateTask(input) {
  const errors = {};

  const title = (input.title ?? "").trim();
  if (title === "") {
    errors.title = "required";
  } else if (title.length > 80) {
    errors.title = "too-long";
  }

  // The three known priorities share one break; a missing priority is "normal".
  const priority = input.priority ?? "normal";
  switch (priority) {
    case "low":
    case "normal":
    case "high":
      break;
    default:
      errors.priority = "unknown";
  }

  if (errors.title !== undefined || errors.priority !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { title: title, dueDate: input.dueDate ?? null, priority: priority } };
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

// Two tasks of the list and a draft of a new one, as a form will send it later.
const firstTask = { id: "t-01", title: "%%nameValue%%", dueDate: "2026-03-02", done: false, priority: "normal" };
const secondTask = { id: "t-03", title: "%%secondName%%", dueDate: null, done: false, priority: "low" };
const draft = { title: "", dueDate: null, priority: "urgent" };

// The page only calls the functions and shows what they return.
const draftCheck = validateTask(draft);
document.querySelector("#first-label").textContent = formatTaskLabel(firstTask);
document.querySelector("#second-label").textContent = formatTaskLabel(secondTask);
document.querySelector("#title-message").textContent = messageFor(draftCheck.errors?.title);
document.querySelector("#priority-message").textContent = messageFor(draftCheck.errors?.priority);
