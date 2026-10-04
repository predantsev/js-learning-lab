// A test helper for node:test: checks one HTTP response against the contract.
// This version builds the AssertionError itself and reads the body with response.json().
import { AssertionError } from 'node:assert';
import { schemaErrors } from './contract.js';

export async function expectContract(response, schema, expectedStatus = 200) {
  if (response.status !== expectedStatus) {
    throw new AssertionError({ message: `expected status ${expectedStatus} but got ${response.status}` });
  }
  const body = await response.json().catch(() => {
    throw new AssertionError({ message: 'the response body is not JSON' });
  });
  const problems = schemaErrors(body, schema);
  if (problems.length) {
    throw new AssertionError({ message: `${problems.length} contract error(s): ${problems.join('; ')}` });
  }
  return body;
}
