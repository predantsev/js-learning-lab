// Mount a panel: Escape hides it, a click is counted, a timer ticks every second.
// teardown() must undo everything mountPanel switched on.
export function mountPanel(root, render) {
  const onKey = (event) => {
    if (event.key === "Escape") {
      root.hidden = true;
    }
  };
  const onClick = () => {
    root.dataset.clicks = String(Number(root.dataset.clicks ?? 0) + 1);
  };
  document.addEventListener("keydown", onKey);
  root.addEventListener("click", onClick);
  const timer = setInterval(() => {
    root.dataset.ticks = String(Number(root.dataset.ticks ?? 0) + 1);
  }, 1000);

  function teardown() {
    document.removeEventListener("keydown", onKey);
    root.removeEventListener("click", onClick);
    clearInterval(timer);
    root.textContent = "";
  }

  try {
    render(root);
  } catch (error) {
    teardown();
    console.warn("render failed");
    return () => {};
  }

  return teardown;
}
