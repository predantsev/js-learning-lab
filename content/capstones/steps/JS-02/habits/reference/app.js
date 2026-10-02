// The project script. It runs after the page has loaded.
// It describes two habits and a draft of a new one, builds the text for the page
// and writes it into the empty paragraphs of index.html.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// Two habits of the list. The completion dates (a list) come in JS-04.
const firstHabit = { id: "h-01", name: "%%nameValue%%", frequency: "daily", active: true };
const secondHabit = { id: "h-04", name: "%%secondName%%", frequency: "weekly", active: true };

// A label is the name and, in words, how often the habit repeats.
let firstFrequency = "";
switch (firstHabit.frequency) {
  case "daily":
    firstFrequency = "%%daily%%";
    break;
  case "weekly":
    firstFrequency = "%%weekly%%";
    break;
}
const firstLabel = firstHabit.name + " · " + firstFrequency;

let secondFrequency = "";
switch (secondHabit.frequency) {
  case "daily":
    secondFrequency = "%%daily%%";
    break;
  case "weekly":
    secondFrequency = "%%weekly%%";
    break;
}
const secondLabel = secondHabit.name + " · " + secondFrequency;

// A draft of a new habit, as a form will send it later.
const draft = { name: "", frequency: "monthly" };

// One message per field; an empty string means the field is fine.
let nameMessage = "";
if (draft.name === "") {
  nameMessage = "%%requiredMessage%%";
}

// The two known frequencies share one break; any other value is unknown.
let frequencyMessage = "";
switch (draft.frequency) {
  case "daily":
  case "weekly":
    break;
  default:
    frequencyMessage = "%%invalidMessage%%";
}

// Each line finds the element with this id and writes the text into it.
document.querySelector("#first-label").textContent = firstLabel;
document.querySelector("#second-label").textContent = secondLabel;
document.querySelector("#name-message").textContent = nameMessage;
document.querySelector("#frequency-message").textContent = frequencyMessage;
