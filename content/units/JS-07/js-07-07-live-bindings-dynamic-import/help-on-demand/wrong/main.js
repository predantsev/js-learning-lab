// A static import: help.js is loaded at the start, whether the help is ever opened or not,
// and the path given to showHelp is ignored.
import { helpText } from "./help.js";

const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

function showHelp(path) {
  helpArea.textContent = helpText;
}

document.querySelector("#help-button").addEventListener("click", () => {
  showHelp(HELP_PATH);
});
