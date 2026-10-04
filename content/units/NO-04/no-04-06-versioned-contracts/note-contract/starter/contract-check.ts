// A contract test: asks a running server for note n-1 in every version and lists what breaks a promise.
import { noteV1Shape, noteV2Shape, shapeErrors } from './contract.ts';

// Returns [] when both versions keep their shapes; otherwise messages that start with "v1" or "v2".
export async function checkContract(base: string): Promise<string[]> {
  const problems: string[] = [];
  // TODO: GET /v1/notes/n-1 and /v2/notes/n-1, check each against its own shape.
  return problems;
}
