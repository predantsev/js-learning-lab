const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
// Mistake: every timer gets the same 1000 ms, so all numbers appear together after one second.
function countdown(from) {
  for (let n = from; n >= 1; n -= 1) {
    setTimeout(() => {
      console.log(n);
    }, 1000);
  }
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
