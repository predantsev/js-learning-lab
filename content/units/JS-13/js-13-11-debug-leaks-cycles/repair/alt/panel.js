// Mount a panel: Escape hides it, a click is counted, a timer ticks every second.
// teardown() must undo everything mountPanel switched on.
export function mountPanel(root, render) {
  const controller = new AbortController();
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      root.hidden = true;
    }
  }, { signal: controller.signal });
  root.addEventListener("click", () => {
    root.dataset.clicks = String(Number(root.dataset.clicks ?? 0) + 1);
  }, { signal: controller.signal });
  const timer = setInterval(() => {
    root.dataset.ticks = String(Number(root.dataset.ticks ?? 0) + 1);
  }, 1000);

  const teardown = () => {
    controller.abort();
    clearInterval(timer);
    root.textContent = "";
  };

  let ready = false;
  try {
    render(root);
    ready = true;
  } finally {
    if (!ready) {
      teardown();
    }
  }
  return teardown;
}
