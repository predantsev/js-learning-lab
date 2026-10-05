// Mistake: checks only the first record — "the rest look the same anyway".
import { parseHabitV1 } from './contract.ts';

export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  if (response.status !== 200) return [`status ${response.status}`];
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return ['body: expected a list'];
  if (body.length === 0) return [];
  return parseHabitV1(body[0]).map((error) => `0: ${error}`);
}
