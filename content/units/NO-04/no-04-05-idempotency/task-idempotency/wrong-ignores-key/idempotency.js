// Misconception: a retry is safe as long as the client waits a little first, so the server need not remember anything.
export function createIdempotencyStore() {
  return {
    async run(key, rawBody, create) {
      return create();
    },
  };
}
