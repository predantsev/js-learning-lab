// Misconception: changing the object in place is fine, nobody else uses it after logging.
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
      for (const [key, inner] of Object.entries(current)) {
        current[key] = secret.has(key.toLowerCase()) ? '[REDACTED]' : walk(inner);
      }
      return current;
    }
    return current; // text, numbers, booleans, null, undefined
  }

  return walk(value);
}
