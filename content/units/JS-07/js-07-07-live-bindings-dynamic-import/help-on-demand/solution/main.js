const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

// showHelp(path): loads the module at `path` only now, with import(),
// and shows its helpText in #help. If loading fails, #help shows FALLBACK.
function showHelp(path) {
  import(path)
    .then((help) => {
      helpArea.textContent = help.helpText;
    })
    .catch(() => {
      helpArea.textContent = FALLBACK;
    });
}

document.querySelector("#help-button").addEventListener("click", () => {
  showHelp(HELP_PATH);
});
