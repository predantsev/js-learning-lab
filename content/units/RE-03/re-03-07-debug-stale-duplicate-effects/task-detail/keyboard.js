// Adds and removes keydown listeners on window and prints how many are attached.
const live = new Set();

export function listen(handler) {
  window.addEventListener("keydown", handler);
  live.add(handler);
  console.log(`listen: live listeners: ${live.size}`);
}

export function unlisten(handler) {
  window.removeEventListener("keydown", handler);
  live.delete(handler);
  console.log(`unlisten: live listeners: ${live.size}`);
}
