// An idempotency store for POST /tasks.
// run(key, rawBody, create):
//   key     — the Idempotency-Key header, or undefined when the client sent none
//   rawBody — the request body exactly as the text that arrived
//   create  — an async function that does the work once and returns { status, body }
// Returns the { status, body } to send.
import { createHash } from 'node:crypto';

export function createIdempotencyStore() {
  const saved = new Map(); // key → { hash, status, body }
  const hashOf = (text) => createHash('sha256').update(text).digest('hex');

  return {
    async run(key, rawBody, create) {
      if (key === undefined) return create(); // no key: nothing to remember
      const hash = hashOf(rawBody);
      const earlier = saved.get(key);
      if (earlier) {
        if (earlier.hash !== hash) {
          return { status: 422, body: { error: { code: 'IDEMPOTENCY_KEY_REUSED', messageKey: 'errors.idempotencyKeyReused', details: {} } } };
        }
        return { status: earlier.status, body: earlier.body }; // the first answer, again
      }
      const result = await create();
      saved.set(key, { hash, status: result.status, body: result.body });
      return result;
    },
  };
}
