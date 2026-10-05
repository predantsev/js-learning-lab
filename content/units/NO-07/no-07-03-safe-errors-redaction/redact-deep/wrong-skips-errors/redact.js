// Misconception: an Error is just another object, so walking its properties is enough.
export function redact(value, { keys }) {
  const secret = new Set(keys.map((key) => key.toLowerCase()));

  function walk(current) {
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
