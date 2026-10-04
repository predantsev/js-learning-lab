// An idempotency store for POST /tasks.
// run(key, rawBody, create):
//   key     — the Idempotency-Key header, or undefined when the client sent none
//   rawBody — the request body exactly as the text that arrived
//   create  — an async function that does the work once and returns { status, body }
// Returns the { status, body } to send.
export function createIdempotencyStore() {
  return {
    async run(key, rawBody, create) {
      // TODO: remember the answer per key; replay it for the same body; refuse a reused key with another body.
      return create();
    },
  };
}
