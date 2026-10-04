// Mistake: the replay keeps the body but answers 200, so the retried create looks different from the first.
import { createHash } from 'node:crypto';

export function createIdempotencyStore() {
  const saved = new Map();
  const hashOf = (text) => createHash('sha256').update(text).digest('hex');
  return {
    async run(key, rawBody, create) {
      if (key === undefined) return create();
      const hash = hashOf(rawBody);
      const earlier = saved.get(key);
      if (earlier) {
        if (earlier.hash !== hash) {
          return { status: 422, body: { error: { code: 'IDEMPOTENCY_KEY_REUSED', messageKey: 'errors.idempotencyKeyReused', details: {} } } };
        }
        return { status: 200, body: earlier.body };
      }
      const result = await create();
      saved.set(key, { hash, body: result.body });
      return result;
    },
  };
}
