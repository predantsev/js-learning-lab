const countLabel = document.querySelector("#count");
let clicks = 0;

document.querySelector("#counter").addEventListener("click", () => {
  clicks += 1;
  countLabel.textContent = clicks;
});

document.querySelector("#busy").addEventListener("click", () => {
  const startedAt = Date.now();

  setTimeout(() => {
    console.log("%%timerRan%%", Date.now() - startedAt, "%%ms%%");
  }, 0);

  // Keep the call stack busy for one second.
  while (Date.now() - startedAt < 1000) {
    // nothing to do: just waiting
  }
  console.log("%%loopDone%%", Date.now() - startedAt, "%%ms%%");
});
