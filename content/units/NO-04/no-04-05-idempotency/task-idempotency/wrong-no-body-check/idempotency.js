// Mistake: a known key is always replayed, even when it now comes with a different task.
export function createIdempotencyStore() {
  const saved = new Map();
  return {
    async run(key, rawBody, create) {
      if (key === undefined) return create();
      if (saved.has(key)) return saved.get(key);
      const result = await create();
      saved.set(key, result);
      return result;
    },
  };
}
