// Misconception: an array is an object too, so Object.entries handles it the same way.
export function redact(value, { keys }) {
  const secret = new Set(keys.map((key) => key.toLowerCase()));

  function walk(current) {
    if (current instanceof Error) {
      const copy = { name: current.name, message: current.message };
      if (current.cause !== undefined) copy.cause = walk(current.cause);
      return copy;
    }
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
