// A test helper for node:test: checks one HTTP response against the contract.
// This version uses the assertions of the example suite: assert.equal for the status and
// assert.deepEqual of the error list against [] (its diff shows every error).
import assert from 'node:assert/strict';
import { schemaErrors } from './contract.js';

export async function expectContract(response, schema, expectedStatus = 200) {
  assert.equal(response.status, expectedStatus);
  let body;
  try {
    body = await response.json();
  } catch (error) {
    assert.fail(`the body is not JSON (${error.message})`);
  }
  assert.deepEqual(schemaErrors(body, schema), []);
  return body;
}
