const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
// Mistake: the stop condition lets the countdown go on to 0.
function countdown(from) {
  console.log(from);
  if (from > 0) {
    setTimeout(() => {
      countdown(from - 1);
    }, 1000);
  }
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
