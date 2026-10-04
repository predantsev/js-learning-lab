// Misconception: the type annotation makes the value a number. The assertion only silences tsc;
// at run time the function returns the text "8080" and lets "abc" through.
export type Env = Record<string, string | undefined>;

export const DEFAULT_PORT: number = 3000;

export function readPort(env: Env): number {
  if (env.PORT === undefined) return DEFAULT_PORT;
  return env.PORT as unknown as number;
}
