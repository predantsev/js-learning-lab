const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

// The path is written into import() directly, so the `path` parameter is ignored.
function showHelp(path) {
  import("./help.js")
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
