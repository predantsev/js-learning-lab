// canCross(value): can this value be a prop passed from a Server Component to a Client Component?
// Follows the list on react.dev, "'use client'" → "Serializable types" (React 19). It cannot tell
// whether a function is a Server Function ('use server') — every function counts as not crossing —
// and it checks values only, not which module a component comes from.
const TYPED = Object.getPrototypeOf(Int8Array);

export function canCross(value, seen = new Set()) {
  if (value === null || ['string', 'number', 'bigint', 'boolean', 'undefined'].includes(typeof value)) return true;
  if (typeof value === 'symbol') return Symbol.keyFor(value) !== undefined;
  if (typeof value === 'function') return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value) || value instanceof Set) return [...value].every((item) => canCross(item, seen));
  if (value instanceof Map) return [...value].every(([key, item]) => canCross(key, seen) && canCross(item, seen));
  if (value instanceof Date || value instanceof Promise || value instanceof ArrayBuffer || value instanceof TYPED) return true;
  if (Object.getPrototypeOf(value) !== Object.prototype) return false; // class instances, null-prototype objects
  return Object.values(value).every((item) => canCross(item, seen));
}
