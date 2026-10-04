// redact(value, { keys }): a copy of `value` that is safe to log. The value of every property whose
// name is in `keys` (any letter case) becomes '[REDACTED]', at any depth. An Error becomes
// { name, message, cause } with its cause redacted too. The input is never changed.
export function redact(value, { keys }) {
  const secret = new Set(keys.map((key) => key.toLowerCase()));

  function walk(current) {
    if (current instanceof Error) {
      const copy = { name: current.name, message: current.message };
      if (current.cause !== undefined) copy.cause = walk(current.cause);
      return copy;
    }
    if (Array.isArray(current)) return current.map(walk);
    if (current !== null && typeof current === 'object') {
      const copy = {};
      for (const [key, inner] of Object.entries(current)) {
        copy[key] = secret.has(key.toLowerCase()) ? '[REDACTED]' : walk(inner);
      }
      return copy;
    }
    return current; // text, numbers, booleans, null, undefined
  }

  return walk(value);
}
