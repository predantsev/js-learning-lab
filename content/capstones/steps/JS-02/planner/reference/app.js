// The project script. It runs after the page has loaded.
// It describes two tasks and a draft of a new one, builds the text for the page
// and writes it into the empty paragraphs of index.html.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// Two tasks of the list. A task without a due date has dueDate null.
const firstTask = { id: "t-01", title: "%%nameValue%%", dueDate: "2026-03-02", done: false, priority: "normal" };
const secondTask = { id: "t-03", title: "%%secondName%%", dueDate: null, done: false, priority: "low" };

// A label is the title with the due date in brackets, or a fallback text when there is none.
const firstLabel = firstTask.title + " (" + (firstTask.dueDate ?? "%%noDueDate%%") + ")";
const secondLabel = secondTask.title + " (" + (secondTask.dueDate ?? "%%noDueDate%%") + ")";

// A draft of a new task, as a form will send it later.
const draft = { title: "", dueDate: null, priority: "urgent" };

// One message per field; an empty string means the field is fine.
let titleMessage = "";
if (draft.title === "") {
  titleMessage = "%%requiredMessage%%";
}

// The three known priorities share one break; any other value is unknown.
let priorityMessage = "";
switch (draft.priority) {
  case "low":
  case "normal":
  case "high":
    break;
  default:
    priorityMessage = "%%invalidMessage%%";
}

// Each line finds the element with this id and writes the text into it.
document.querySelector("#first-label").textContent = firstLabel;
document.querySelector("#second-label").textContent = secondLabel;
document.querySelector("#title-message").textContent = titleMessage;
document.querySelector("#priority-message").textContent = priorityMessage;
