// Another valid solution: Number.isInteger and a separate guard for text that is not digits.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

function isPortText(text: string): boolean {
  const port = Number(text);
  return text.trim() === text && text !== "" && Number.isInteger(port) && port >= 1 && port <= 65535 && !text.includes(".");
}

export function readPort(env: Env): number {
  if (env.PORT === undefined) return DEFAULT_PORT;
  if (!isPortText(env.PORT)) throw new RangeError(`Invalid PORT "${env.PORT}" (expected 1–65535)`);
  return Number(env.PORT);
}
