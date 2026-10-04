// A test helper for node:test: checks one HTTP response against the contract.
import assert from 'node:assert/strict';
import { schemaErrors } from './contract.js';

export async function expectContract(response, schema, expectedStatus = 200) {
  // TODO: status, JSON body, every contract error in one AssertionError; return the body
}
