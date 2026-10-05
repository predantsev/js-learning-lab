const PRIMITIVES = ["string", "number", "boolean", "bigint", "undefined"];

function check(value) {
  if (value === null || PRIMITIVES.includes(typeof value)) return true;
  if (typeof value === "function") return false;
  switch (value.constructor) {
    case Date:
      return true;
    case Array:
    case Set:
      return [...value].every(check);
    case Map:
      return [...value.keys(), ...value.values()].every(check);
    case Object:
      return Object.values(value).every(check);
    default:
      return false;
  }
}

export function assertCrossable(props) {
  const bad = Object.keys(props).find((key) => !check(props[key]));
  if (bad !== undefined) throw new TypeError(`${bad} is not serializable`);
  return true;
}
