// Misconception: parseInt checks the text. It reads digits until the first non-digit, so
// "30.5" becomes 30 and "8080abc" becomes 8080.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

export function readPort(env: Env): number {
  if (env.PORT === undefined) return DEFAULT_PORT;
  const port = Number.parseInt(env.PORT, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new RangeError(`PORT must be a whole number from 1 to 65535, got "${env.PORT}"`);
  }
  return port;
}
