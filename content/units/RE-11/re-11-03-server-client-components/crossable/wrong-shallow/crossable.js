// Checks only the top level: a function inside an array or an object is not noticed.
export function assertCrossable(props) {
  for (const [name, value] of Object.entries(props)) {
    if (typeof value === "function") throw new TypeError(`prop "${name}" is a function`);
    if (value !== null && typeof value === "object") {
      const ok = value instanceof Date || value instanceof Map || value instanceof Set || Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
      if (!ok) throw new TypeError(`prop "${name}" is a class instance`);
    }
  }
  return true;
}
