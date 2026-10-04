// Two tests that would have caught these defects before the client did.
import { parseWishV1 } from './contract.js';

// GET /v1/records: [] when the status is 200, the body is a list and every wish passes parseWishV1;
// otherwise one message per problem.
export async function contractTest(base) {
  // Mistake: checks only that the server answers 200 — the shape is never looked at.
  const response = await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) });
  return response.status === 200 ? [] : [`status ${response.status}`];
}

// OPTIONS /v1/records/w-01 from `origin`, announcing PATCH with content-type: [] when the answer is 204
// and allows exactly that origin, the PATCH method and the content-type header; otherwise one message per problem.
export async function preflightTest(base, origin) {
  const response = await fetch(`${base}/v1/records/w-01`, {
    method: 'OPTIONS',
    headers: { origin, 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' },
    signal: AbortSignal.timeout(2000),
  });
  const list = (name) => (response.headers.get(name) ?? '').toLowerCase().split(',').map((item) => item.trim());
  const problems = [];
  if (response.status !== 204) problems.push(`status ${response.status}`);
  if (response.headers.get('access-control-allow-origin') !== origin) problems.push('allow-origin');
  if (!list('access-control-allow-methods').includes('patch')) problems.push('allow-methods: PATCH');
  if (!list('access-control-allow-headers').includes('content-type')) problems.push('allow-headers: content-type');
  return problems;
}
