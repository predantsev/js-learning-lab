// Throws a TypeError naming the first prop whose value cannot cross from a Server Component
// to a Client Component; returns true when every prop can cross.
export function assertCrossable(props) {
  for (const [name, value] of Object.entries(props)) {
    if (!canCross(value)) throw new TypeError(`prop "${name}" cannot cross the server/client boundary`);
  }
  return true;
}

function canCross(value) {
  if (value === null || value === undefined) return true;
  const kind = typeof value;
  if (kind === "string" || kind === "number" || kind === "boolean" || kind === "bigint") return true;
  if (kind !== "object") return false; // functions and symbols
  if (value instanceof Date) return true;
  if (Array.isArray(value)) return value.every(canCross);
  if (value instanceof Map) return [...value].every(([key, entry]) => canCross(key) && canCross(entry));
  if (value instanceof Set) return [...value].every(canCross);
  if (Object.getPrototypeOf(value) === Object.prototype) return Object.values(value).every(canCross);
  return false; // an instance of some other class
}
