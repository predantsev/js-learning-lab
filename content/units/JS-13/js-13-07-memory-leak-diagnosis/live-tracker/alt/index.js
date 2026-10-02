// Instrumentation for leak checks.
// tracker.listen(target, type, handler) really adds the listener and returns remove().
// remove() really removes it; calling remove() again changes nothing.
// tracker.countLive() is how many listeners added through this tracker are still on.
// The same handler for the same target and type is held once, as the browser does.
function createListenerTracker() {
  // target → (type → Set of handlers)
  const byTarget = new Map();

  function handlersFor(target, type) {
    if (!byTarget.has(target)) {
      byTarget.set(target, new Map());
    }
    const byType = byTarget.get(target);
    if (!byType.has(type)) {
      byType.set(type, new Set());
    }
    return byType.get(type);
  }

  function listen(target, type, handler) {
    const handlers = handlersFor(target, type);
    handlers.add(handler);
    target.addEventListener(type, handler);
    return function remove() {
      target.removeEventListener(type, handler);
      handlers.delete(handler);
    };
  }

  function countLive() {
    let total = 0;
    for (const byType of byTarget.values()) {
      for (const handlers of byType.values()) {
        total = total + handlers.size;
      }
    }
    return total;
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
