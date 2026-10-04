// Two tests that would have caught these defects before the client did.
import { parseWishV1 } from './contract.js';

// GET /v1/records: [] when the status is 200, the body is a list and every wish passes parseWishV1;
// otherwise one message per problem.
export async function contractTest(base) {
  // TODO
  return [];
}

// OPTIONS /v1/records/w-01 from `origin`, announcing PATCH with content-type: [] when the answer is 204
// and allows exactly that origin, the PATCH method and the content-type header; otherwise one message per problem.
export async function preflightTest(base, origin) {
  // TODO
  return [];
}
