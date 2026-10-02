const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

// Loads on demand, but nothing handles a failed load: a wrong path leaves the help area as it was.
function showHelp(path) {
  import(path).then((help) => {
    helpArea.textContent = help.helpText;
  });
}

document.querySelector("#help-button").addEventListener("click", () => {
  showHelp(HELP_PATH);
});
