// Instrumentation for leak checks.
// tracker.listen(target, type, handler) really adds the listener and returns remove().
// remove() really removes it; calling remove() again changes nothing.
// tracker.countLive() is how many listeners added through this tracker are still on.
// The same handler for the same target and type is held once, as the browser does.
function createListenerTracker() {
  function listen(target, type, handler) {
    target.addEventListener(type, handler);
    return function remove() {
      target.removeEventListener(type, handler);
    };
  }

  function countLive() {
    return 0;
  }

  return { listen, countLive };
}

const tracker = createListenerTracker();

function openDialog() {
  const dialog = document.createElement("div");
  dialog.textContent = "%%reminder%%";
  document.body.append(dialog);
  const offClick = tracker.listen(dialog, "click", () => dialog.classList.toggle("seen"));
  const offKey = tracker.listen(document, "keydown", () => dialog.remove());
  return function close() {
    offClick();
    offKey();
    dialog.remove();
  };
}

for (let i = 0; i < 10; i = i + 1) {
  const close = openDialog();
  close();
}
console.log(tracker.countLive());

openDialog();
console.log(tracker.countLive());
