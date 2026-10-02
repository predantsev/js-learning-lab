const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
function countdown(from) {
  // your code here
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
