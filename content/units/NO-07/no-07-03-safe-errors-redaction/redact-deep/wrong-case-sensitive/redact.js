// Misconception: header and key names always arrive in the same letter case as in my list.
export function redact(value, { keys }) {
  const secret = new Set(keys);

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
        copy[key] = secret.has(key) ? '[REDACTED]' : walk(inner);
      }
      return copy;
    }
    return current; // text, numbers, booleans, null, undefined
  }

  return walk(value);
}
