const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
// Another approach: an inner function that passes itself to setTimeout.
function countdown(from) {
  let current = from;
  function tick() {
    console.log(current);
    current -= 1;
    if (current >= 1) {
      setTimeout(tick, 1000);
    }
  }
  tick();
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
