// Another valid solution: both versions are requested at the same time.
import { noteV1Shape, noteV2Shape, shapeErrors } from './contract.ts';

export async function checkContract(base: string): Promise<string[]> {
  const checks = await Promise.all(
    Object.entries({ v1: noteV1Shape, v2: noteV2Shape }).map(async ([version, shape]) => {
      const response = await fetch(`${base}/${version}/notes/n-1`, { signal: AbortSignal.timeout(2000) });
      const errors = response.ok ? shapeErrors(await response.json(), shape) : [`status ${response.status}`];
      return errors.map((error) => `${version} ${error}`);
    }),
  );
  return checks.flat();
}
