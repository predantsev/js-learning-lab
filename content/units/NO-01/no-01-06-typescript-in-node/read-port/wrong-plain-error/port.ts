// Breaks one stated rule: the check is right, but it throws a plain Error, not a RangeError.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

export function readPort(env: Env): number {
  const text = env.PORT;
  if (text === undefined) return DEFAULT_PORT;
  const port = Number(text);
  if (!/^\d+$/.test(text) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a whole number from 1 to 65535, got "${text}"`);
  }
  return port;
}
