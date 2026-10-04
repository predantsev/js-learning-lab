// Reads the server port from an environment object such as process.env.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

// The return type promises a number. Only a check at run time can keep that promise for "abc".
export function readPort(env: Env): number {
  return Number(env.PORT ?? DEFAULT_PORT);
}
