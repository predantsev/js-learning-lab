// Mount a small widget into root:
// - a window "resize" updates root.dataset.width,
// - a click on root counts root.dataset.clicks,
// - every second root.dataset.ticks grows by one,
// - render(root) draws the content (it may throw).
// Return teardown(): it removes both listeners, stops the timer and empties root.
// teardown() must be safe to call twice.
// If render throws, clean up what was set up and let the same error reach the caller.
function mountWidget(root, render) {
  root.dataset.clicks = "0";
  root.dataset.ticks = "0";

  function onResize() {
    root.dataset.width = String(window.innerWidth);
  }
  function onClick() {
    root.dataset.clicks = String(Number(root.dataset.clicks) + 1);
  }
  let timer = null;
  let done = false;

  function teardown() {
    if (done) {
      return;
    }
    done = true;
    window.removeEventListener("resize", onResize);
    root.removeEventListener("click", onClick);
    clearInterval(timer);
    root.textContent = "";
  }

  // Draw first: if render throws, nothing is switched on yet, so there is nothing to clean up
  // except the content it may have left in root.
  try {
    render(root);
  } catch (error) {
    root.textContent = "";
    throw error;
  }

  window.addEventListener("resize", onResize);
  root.addEventListener("click", onClick);
  timer = setInterval(() => {
    root.dataset.ticks = String(Number(root.dataset.ticks) + 1);
  }, 1000);
  return teardown;
}

const root = document.createElement("div");
document.body.append(root);

const teardown = mountWidget(root, (element) => {
  element.textContent = "%%summary%%";
});
teardown();
teardown();
console.log(root.textContent === "" ? "%%clean%%" : "%%left%%");

try {
  mountWidget(root, () => {
    throw new Error("%%broken%%");
  });
} catch (error) {
  console.log(error.message);
}
