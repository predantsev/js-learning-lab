const HELP_PATH = "./help.js";
const FALLBACK = "%%fallback%%";
const helpArea = document.querySelector("#help");

// The two-function form of .then: the second function runs when loading fails.
function showHelp(path) {
  return import(path).then(
    (module) => {
      helpArea.textContent = module.helpText;
    },
    (error) => {
      console.log("help not loaded: " + error.message);
      helpArea.textContent = FALLBACK;
    },
  );
}

document.querySelector("#help-button").addEventListener("click", () => {
  showHelp(HELP_PATH);
});
