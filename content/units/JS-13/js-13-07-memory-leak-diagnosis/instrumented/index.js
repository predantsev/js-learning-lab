// A tiny registry: every listener and timer goes through it, so we can count what is still live.
const live = { listeners: 0, timers: 0 };

function listen(target, type, handler) {
  target.addEventListener(type, handler);
  live.listeners = live.listeners + 1;
  return () => {
    target.removeEventListener(type, handler);
    live.listeners = live.listeners - 1;
  };
}

function every(ms, callback) {
  const id = setInterval(callback, ms);
  live.timers = live.timers + 1;
  return () => {
    clearInterval(id);
    live.timers = live.timers - 1;
  };
}

function openDialog() {
  const dialog = document.createElement("div");
  dialog.textContent = "%%reminder%%";
  document.body.append(dialog);
  const offClick = listen(dialog, "click", () => dialog.classList.toggle("seen"));
  const offEscape = listen(document, "keydown", (event) => {
    if (event.key === "Escape") {
      dialog.remove();
    }
  });
  const stopBlink = every(500, () => dialog.classList.toggle("blink"));

  return function close() {
    offClick();
    dialog.remove();
  };
}

function cycles(count) {
  for (let i = 0; i < count; i = i + 1) {
    const close = openDialog();
    close();
  }
}

function report(label) {
  console.log(label, "%%listeners%%", live.listeners, "%%timers%%", live.timers);
}

report("%%start%%");
cycles(10);
report("%%after10%%");
cycles(10);
report("%%after20%%");
