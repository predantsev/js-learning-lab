// Mistake: assumes the body is a list, so { items: [...] } crashes the test instead of being reported.
import { parseHabitV1 } from './contract.ts';

export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  if (response.status !== 200) return [`status ${response.status}`];
  const body = await response.json();
  return body.flatMap((habit: unknown, index: number) => parseHabitV1(habit).map((error) => `${index}: ${error}`));
}
