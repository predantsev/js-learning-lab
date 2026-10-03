const OUTCOMES = {
  mock: 'test-passes-app-breaks',
  tdz: 'undefined-then-ReferenceError',
  modules: '1-then-0',
  storage: 'cookie-only',
  cors: 'server-handles-page-cannot-read',
  finalizer: 'maybe-later-or-never',
};
const WORDS = { mock: 'fetch', tdz: 'let', modules: 'require', storage: 'localStorage', cors: 'Access-Control-Allow-Origin', finalizer: 'FinalizationRegistry' };

async function item(key) {
  const { answers } = await import('./answers.js');
  expect(answers !== null && typeof answers === 'object', 'answers is an object').toBe(true);
  return answers[key] ?? {};
}
// Sentences: pieces of text that end with . ! or ? followed by a space or the end.
const sentences = (text) => String(text ?? '').trim().split(/(?<=[.!?])\s+/).filter((part) => part.replace(/[^\p{L}\p{N}]/gu, '').length >= 15);

for (const key of Object.keys(OUTCOMES)) {
  test(`${key}: the outcome is what really happens`, async () => {
    // A boolean comparison: a failure message must not print the expected outcome.
    const { outcome } = await item(key);
    expect(outcome === OUTCOMES[key], `answers.${key}.outcome (${JSON.stringify(outcome ?? null)}) is what really happens`).toBe(true);
  });
  test(`${key}: the reason has two sentences and names the code word`, async () => {
    const { reason } = await item(key);
    expect(sentences(reason).length, `sentences in answers.${key}.reason`).toBeGreaterThanOrEqual(2);
    expect(String(reason ?? '').includes(WORDS[key]), `answers.${key}.reason names ${WORDS[key]}`).toBe(true);
  });
}
