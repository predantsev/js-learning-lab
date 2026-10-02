const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

// import() is used as if the module were ready on the very next line: it is not.
function showHelp(path) {
  const help = import(path);
  helpArea.textContent = help.helpText;
}

document.querySelector("#help-button").addEventListener("click", () => {
  showHelp(HELP_PATH);
});
