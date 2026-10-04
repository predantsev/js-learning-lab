// Another valid solution: Number.isInteger plus a round trip — the number written back must give
// the same text, so "", " 80", "1e3" and "8080abc" are rejected.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

function isPortText(text: string): boolean {
  const port = Number(text);
  return String(port) === text && Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function readPort(env: Env): number {
  if (env.PORT === undefined) return DEFAULT_PORT;
  if (!isPortText(env.PORT)) throw new RangeError(`Invalid PORT "${env.PORT}" (expected 1–65535)`);
  return Number(env.PORT);
}
