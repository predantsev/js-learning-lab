// Rejects functions anywhere, but treats every object as data — a class instance slips through.
function canCross(value) {
  if (typeof value === "function") return false;
  if (value instanceof Map) return [...value].every(([key, entry]) => canCross(key) && canCross(entry));
  if (value instanceof Set) return [...value].every(canCross);
  if (value !== null && typeof value === "object" && !(value instanceof Date)) return Object.values(value).every(canCross);
  return true;
}

export function assertCrossable(props) {
  for (const [name, value] of Object.entries(props)) {
    if (!canCross(value)) throw new TypeError(`prop "${name}" cannot cross`);
  }
  return true;
}
