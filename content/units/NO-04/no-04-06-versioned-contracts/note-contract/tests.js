// The contract module on its own, then the contract test against the real server and against
// servers that changed their responses — compatibly and incompatibly.
import http from 'node:http';
import { createApp } from './app.js';
import { checkContract } from './contract-check.ts';
import { noteV1Shape, noteV2Shape, shapeErrors } from './contract.ts';

const v1 = { id: 'n-1', title: 'a', text: '', pinned: false };
const v2 = { id: 'n-1', heading: 'a', text: '', pinned: false };
// A server that answers /v1/notes/n-1 and /v2/notes/n-1 with the given bodies.
const serverWith = (v1Body, v2Body) => http.createServer((request, response) => {
  const body = { '/v1/notes/n-1': v1Body, '/v2/notes/n-1': v2Body }[request.url];
  response.writeHead(body ? 200 : 404, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body ?? { error: { code: 'NOT_FOUND' } }));
});
const check = async (server) => {
  expect(typeof checkContract, 'type of checkContract').toBe('function');
  return checkContract(await listen(server));
};
const versionsIn = (problems) => [...new Set((problems ?? []).map((problem) => String(problem).slice(0, 2)))].sort();

test('noteV1Shape and noteV2Shape describe the two versions', () => {
  expect(noteV1Shape, 'noteV1Shape').toEqual({ id: 'string', title: 'string', text: 'string', pinned: 'boolean' });
  expect(noteV2Shape, 'noteV2Shape').toEqual({ id: 'string', heading: 'string', text: 'string', pinned: 'boolean' });
});

test('shapeErrors reports a missing field and a wrong type', () => {
  expect(shapeErrors(v1, noteV1Shape), 'errors for a correct v1 note').toEqual([]);
  expect(shapeErrors({ ...v1, title: undefined }, noteV1Shape).length, 'errors without title').toBe(1);
  expect(shapeErrors({ ...v1, pinned: 'no' }, noteV1Shape).length, 'errors for pinned "no"').toBe(1);
});

test('shapeErrors accepts extra fields', () => {
  expect(shapeErrors({ ...v1, updatedAt: '2026-03-01' }, noteV1Shape), 'errors for a v1 note with updatedAt').toEqual([]);
});

test('checkContract finds no problem on the real server', async () => {
  expect(await check(createApp()), 'problems on the real server').toEqual([]);
});

test('checkContract catches a breaking change in v1', async () => {
  const renamed = { id: 'n-1', heading: 'a', text: '', pinned: false };
  expect(versionsIn(await check(serverWith(renamed, v2))), 'versions with problems when v1 renamed title').toEqual(['v1']);
});

test('checkContract catches a v2 that broke its own shape', async () => {
  const pinnedAsText = { ...v2, pinned: 'yes' };
  expect(versionsIn(await check(serverWith(v1, pinnedAsText))), 'versions with problems when v2 pinned is text').toEqual(['v2']);
});

test('checkContract accepts a new optional field in v1', async () => {
  expect(await check(serverWith({ ...v1, updatedAt: '2026-03-01' }, v2)), 'problems when v1 added updatedAt').toEqual([]);
});
