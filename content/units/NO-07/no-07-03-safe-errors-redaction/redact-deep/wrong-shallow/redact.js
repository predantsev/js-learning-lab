// Misconception: secrets sit only at the top of a config object.
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
        copy[key] = secret.has(key.toLowerCase()) ? '[REDACTED]' : inner instanceof Error ? walk(inner) : inner;
      }
      return copy;
    }
    return current; // text, numbers, booleans, null, undefined
  }

  return walk(value);
}
