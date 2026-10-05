// Two tests that would have caught these defects, written with the answers' text.
import { parseWishV1 } from './contract.js';

export async function contractTest(base) {
  const response = await fetch(base + '/v1/records');
  if (!response.ok) return ['GET /v1/records answered ' + response.status];
  const wishes = await response.json();
  if (!Array.isArray(wishes)) return ['the body is not a list'];
  const problems = [];
  wishes.forEach((wish, index) => {
    for (const error of parseWishV1(wish)) problems.push('wish ' + index + ' — ' + error);
  });
  return problems;
}

export async function preflightTest(base, origin) {
  const response = await fetch(base + '/v1/records/w-01', {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'PATCH', 'Access-Control-Request-Headers': 'Content-Type' },
  });
  const methods = response.headers.get('access-control-allow-methods') ?? '';
  const headers = (response.headers.get('access-control-allow-headers') ?? '').toLowerCase();
  const problems = [];
  if (response.status !== 204) problems.push('preflight answered ' + response.status);
  if (response.headers.get('access-control-allow-origin') !== origin) problems.push('origin not allowed');
  if (!/\bPATCH\b/i.test(methods)) problems.push('PATCH not allowed');
  if (!/\bcontent-type\b/.test(headers)) problems.push('content-type not allowed');
  return problems;
}
