// A test helper for node:test: checks one HTTP response against the contract.
import assert from 'node:assert/strict';
import { schemaErrors } from './contract.js';

export async function expectContract(response, schema, expectedStatus = 200) {
  const text = await response.text();
  if (response.status !== expectedStatus) {
    assert.fail(`status ${response.status}, expected ${expectedStatus}: ${text.slice(0, 200)}`);
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    assert.fail(`body is not JSON: ${text.slice(0, 200)}`);
  }
  const errors = schemaErrors(body, schema);
  if (errors.length > 0) throw new Error(`contract broken:\n${errors.join('\n')}`);
  return body;
}
