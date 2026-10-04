// Mistake: treats every field the contract does not name as a problem, so a compatible change fails.
import { parseHabitV1 } from './contract.ts';

const KNOWN = ['id', 'name', 'frequency', 'active', 'completions'];

export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  if (response.status !== 200) return [`status ${response.status}`];
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return ['body: expected a list'];
  return body.flatMap((habit, index) => [
    ...parseHabitV1(habit).map((error) => `${index}: ${error}`),
    ...Object.keys(habit).filter((field) => !KNOWN.includes(field)).map((field) => `${index}: ${field}: unexpected field`),
  ]);
}
