// Development helper (read-only): adds 50 demo wishes for testing long lists.
// It refuses to run in a release build. `calls` lets the checks see whether it ran.
export const calls = { count: 0 };

export function seedDemoWishes(wishes) {
  calls.count += 1;
  if (!__DEV__) throw new Error('dev/seed.js must not run in a release build');
  const demo = Array.from({ length: 50 }, (_, i) => ({ id: `demo-${i + 1}`, name: `Demo ${i + 1}`, price: 10, acquired: false }));
  return [...wishes, ...demo];
}
