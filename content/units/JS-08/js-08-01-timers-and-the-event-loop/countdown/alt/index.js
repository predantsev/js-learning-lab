const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
// Another approach: register all timers at once, each one second later than the previous.
function countdown(from) {
  for (let step = 0; step < from; step += 1) {
    setTimeout(() => {
      console.log(from - step);
    }, step * 1000);
  }
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
