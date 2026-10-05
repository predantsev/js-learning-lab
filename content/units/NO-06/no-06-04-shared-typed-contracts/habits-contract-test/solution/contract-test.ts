// The contract test: asks a running server for GET /v1/records and checks the answer against contract v1.
import { parseHabitV1 } from './contract.ts';

// Returns [] when the answer keeps the contract, otherwise one message per problem.
export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  if (response.status !== 200) return [`status ${response.status}`];
  const body: unknown = await response.json();
  if (!Array.isArray(body)) return ['body: expected a list'];
  return body.flatMap((habit, index) => parseHabitV1(habit).map((error) => `${index}: ${error}`));
}
