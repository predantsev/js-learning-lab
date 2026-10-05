const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

// Prints `from` right away, then every second the next smaller
// number, down to 1. The page must stay clickable meanwhile.
// Another approach: a repeating timer that is cleared after the number 1.
function countdown(from) {
  let current = from;
  console.log(current);
  if (current <= 1) {
    return;
  }
  const ticking = setInterval(() => {
    current -= 1;
    console.log(current);
    if (current === 1) {
      clearInterval(ticking);
    }
  }, 1000);
}

document.querySelector("#start").addEventListener("click", () => {
  countdown(3);
});
