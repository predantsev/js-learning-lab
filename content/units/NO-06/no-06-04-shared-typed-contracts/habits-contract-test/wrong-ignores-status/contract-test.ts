// Mistake: looks only at the body, so an error answer with an empty list passes.
import { parseHabitV1 } from './contract.ts';

export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return ['body: expected a list'];
  return body.flatMap((habit, index) => parseHabitV1(habit).map((error) => `${index}: ${error}`));
}
