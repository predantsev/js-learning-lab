// The contract test, written with a loop and an explicit list of problems.
import { parseHabitV1 } from './contract.ts';

export async function checkRecordsContract(base: string): Promise<string[]> {
  const response = await fetch(`${base}/v1/records`);
  if (response.status !== 200) {
    return [`status ${response.status}`];
  }
  const habits = await response.json();
  if (!Array.isArray(habits)) {
    return ['body: expected a list'];
  }
  const problems: string[] = [];
  for (let index = 0; index < habits.length; index += 1) {
    for (const error of parseHabitV1(habits[index])) problems.push(`${index}: ${error}`);
  }
  return problems;
}
