// Read-only instrumentation: counts the listeners and intervals that are still live.
// index.js imports this module first, so everything after it is counted.
const listeners = new Set();
const timers = new Set();

const add = EventTarget.prototype.addEventListener;
const remove = EventTarget.prototype.removeEventListener;
const keyOf = (target, type, handler) => ({ target, type, handler });
function find(target, type, handler) {
  for (const entry of listeners) {
    if (entry.target === target && entry.type === type && entry.handler === handler) {
      return entry;
    }
  }
  return null;
}

EventTarget.prototype.addEventListener = function (type, handler, options) {
  add.call(this, type, handler, options);
  if (typeof handler !== "function" || find(this, type, handler)) {
    return;
  }
  const entry = keyOf(this, type, handler);
  listeners.add(entry);
  const signal = options && typeof options === "object" ? options.signal : undefined;
  if (signal) {
    add.call(signal, "abort", () => listeners.delete(entry), { once: true });
  }
};

EventTarget.prototype.removeEventListener = function (type, handler, options) {
  remove.call(this, type, handler, options);
  const entry = find(this, type, handler);
  if (entry) {
    listeners.delete(entry);
  }
};

const realSetInterval = window.setInterval;
const realClearInterval = window.clearInterval;
window.setInterval = (callback, ms, ...args) => {
  const id = realSetInterval(callback, ms, ...args);
  timers.add(id);
  return id;
};
window.clearInterval = (id) => {
  timers.delete(id);
  realClearInterval(id);
};

export function live() {
  return { listeners: listeners.size, timers: timers.size };
}
