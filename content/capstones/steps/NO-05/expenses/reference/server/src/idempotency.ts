// Idempotent creates: a client sends the same Idempotency-Key with every retry of one user action. Per
// key the store remembers the SHA-256 of the raw body and the answer. The same key with the same body
// gets the same answer again without a second create; the same key with another body is a 422. Without a
// key nothing is remembered. The store lives in the server's memory: a restart forgets the keys, and two
// retries that arrive at the same moment are not handled (a real service keeps keys for a limited time,
// in shared storage).
import { createHash } from "node:crypto";
import { ApiError } from "./api-errors.ts";

export type Answer = { status: number; body: unknown };

export type IdempotencyStore = {
  run(key: string | undefined, rawBody: string, create: () => Promise<Answer>): Promise<Answer>;
};

export function createIdempotencyStore(): IdempotencyStore {
  const saved = new Map<string, { hash: string; answer: Answer }>();
  const hashOf = (text: string) => createHash("sha256").update(text).digest("hex");
  return {
    async run(key, rawBody, create) {
      if (key === undefined) {
        return create();
      }
      const hash = hashOf(rawBody);
      const earlier = saved.get(key);
      if (earlier !== undefined) {
        if (earlier.hash !== hash) {
          throw new ApiError(422, "IDEMPOTENCY_KEY_REUSED");
        }
        return earlier.answer;
      }
      // Remembered only after the create succeeded: a failed create can be retried with the same key.
      const answer = await create();
      saved.set(key, { hash: hash, answer: answer });
      return answer;
    },
  };
}
