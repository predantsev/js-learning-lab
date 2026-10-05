// The contract test: asks a running server for GET /v1/records and checks the answer against contract v1.
import { parseHabitV1 } from './contract.ts';

// Returns [] when the answer keeps the contract, otherwise one message per problem.
export async function checkRecordsContract(base: string): Promise<string[]> {
  // TODO
  return [];
}
