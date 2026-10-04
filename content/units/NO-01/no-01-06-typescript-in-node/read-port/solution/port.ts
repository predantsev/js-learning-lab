// Reads the server port from an environment object such as process.env.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

// The return type promises a number; the check below keeps that promise at run time.
export function readPort(env: Env): number {
  const text = env.PORT;
  if (text === undefined) return DEFAULT_PORT;
  const port = Number(text);
  if (!/^\d+$/.test(text) || port < 1 || port > 65535) {
    throw new RangeError(`PORT must be a whole number from 1 to 65535, got "${text}"`);
  }
  return port;
}
