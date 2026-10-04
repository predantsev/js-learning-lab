// A contract test: asks a running server for note n-1 in every version and lists what breaks a promise.
import { noteV1Shape, noteV2Shape, shapeErrors } from './contract.ts';
import type { Shape } from './contract.ts';

// Returns [] when both versions keep their shapes; otherwise messages that start with "v1" or "v2".
export async function checkContract(base: string): Promise<string[]> {
  const problems: string[] = [];
  const versions: Array<[string, Shape]> = [['v1', noteV1Shape], ['v2', noteV2Shape]];
  for (const [version, shape] of versions) {
    const response = await fetch(`${base}/${version}/notes/n-1`, { signal: AbortSignal.timeout(2000) });
    if (response.status !== 200) {
      problems.push(`${version}: status ${response.status}`);
      continue;
    }
    for (const error of shapeErrors(await response.json(), shape)) problems.push(`${version}: ${error}`);
  }
  return problems;
}
