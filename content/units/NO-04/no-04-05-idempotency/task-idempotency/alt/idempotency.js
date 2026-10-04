// Another valid solution: the raw body text itself is kept and compared, without a hash.
export function createIdempotencyStore() {
  const answers = {};

  return {
    async run(key, rawBody, create) {
      if (!key) return create();
      if (Object.hasOwn(answers, key)) {
        const { body: sentBody, answer } = answers[key];
        if (sentBody === rawBody) return answer;
        return {
          status: 422,
          body: { error: { code: 'IDEMPOTENCY_KEY_REUSED', messageKey: 'errors.idempotencyKeyReused', details: {} } },
        };
      }
      const answer = await create();
      answers[key] = { body: rawBody, answer };
      return answer;
    },
  };
}
