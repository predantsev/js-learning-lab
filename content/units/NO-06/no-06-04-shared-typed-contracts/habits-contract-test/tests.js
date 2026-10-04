// The contract test against the real server and against servers that drifted from contract v1.
import http from 'node:http';
import { createServer } from './server.js';
import { checkRecordsContract } from './contract-test.ts';

const habit = (id, changes = {}) => ({ id, name: `habit ${id}`, frequency: 'daily', active: true, completions: ['2026-03-01'], ...changes });
const answering = (status, body) => http.createServer((request, response) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
});
const check = async (server) => {
  expect(typeof checkRecordsContract, 'type of checkRecordsContract').toBe('function');
  return checkRecordsContract(await listen(server));
};

test('the real server keeps the contract', async () => {
  expect(await check(createServer()), 'problems on the real server').toEqual([]);
});

test('a field renamed on the server is reported for every record, with its index', async () => {
  const renamed = ['h-1', 'h-2', 'h-3'].map((id) => {
    const { active, ...rest } = habit(id);
    return { ...rest, isActive: active };
  });
  const problems = await check(answering(200, renamed));
  expect(problems, 'problems when active became isActive').toEqual(['0: active: expected boolean', '1: active: expected boolean', '2: active: expected boolean']);
});

test('a wrong value is reported with the message of the shared schema', async () => {
  const problems = await check(answering(200, [habit('h-1', { frequency: 'monthly' }), habit('h-2')]));
  expect(problems, 'problems when frequency is monthly').toEqual(['0: frequency: expected daily or weekly']);
});

test('extra fields are not problems', async () => {
  expect(await check(answering(200, [habit('h-1', { color: 'green' })])), 'problems with an extra color field').toEqual([]);
});

test('a status other than 200 gives one problem: status N', async () => {
  expect(await check(answering(503, [])), 'problems for a 503 answer').toEqual(['status 503']);
});

test('a body that is not a list gives one problem', async () => {
  expect(await check(answering(200, { items: [habit('h-1')] })), 'problems for { items: [...] }').toEqual(['body: expected a list']);
});
