// "Crossable means survives JSON": rejects Date, Map and Set, which React does pass.
export function assertCrossable(props) {
  for (const [name, value] of Object.entries(props)) {
    const copy = JSON.parse(JSON.stringify({ value }) ?? "{}").value;
    if (JSON.stringify(copy) !== JSON.stringify(value) || typeof value === "function" || (value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
      throw new TypeError(`prop "${name}" cannot cross`);
    }
  }
  return true;
}
