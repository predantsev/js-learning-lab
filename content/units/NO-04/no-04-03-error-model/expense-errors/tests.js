// toErrorResponse on its own, then the API's failures over real HTTP.
import { createApp } from './app.js';
import { ConflictError, NotFoundError, ValidationError } from './errors.js';
import { toErrorResponse } from './to-error-response.js';

const mapped = (error, requestId) => {
  expect(typeof toErrorResponse, 'type of toErrorResponse').toBe('function');
  return toErrorResponse(error, requestId);
};
const model = (status, code, messageKey, details, requestId) => ({ status, body: { error: { code, messageKey, details, requestId } } });

test('ValidationError → 400 VALIDATION_FAILED with the field errors', () => {
  expect(mapped(new ValidationError({ amountMinor: 'notPositive' }), 'req-1'), 'answer for a ValidationError')
    .toEqual(model(400, 'VALIDATION_FAILED', 'errors.validationFailed', { amountMinor: 'notPositive' }, 'req-1'));
});

test('NotFoundError → 404 NOT_FOUND with the id', () => {
  expect(mapped(new NotFoundError('e-99'), 'req-2'), 'answer for a NotFoundError')
    .toEqual(model(404, 'NOT_FOUND', 'errors.notFound', { id: 'e-99' }, 'req-2'));
});

test('ConflictError → 409 CONFLICT with the id', () => {
  expect(mapped(new ConflictError('e-01'), 'req-3'), 'answer for a ConflictError')
    .toEqual(model(409, 'CONFLICT', 'errors.conflict', { id: 'e-01' }, 'req-3'));
});

test('anything else → 500 INTERNAL, with no message and no stack', () => {
  const bug = new TypeError("Cannot read properties of undefined (reading 'url')");
  expect(mapped(bug, 'req-4'), 'answer for a TypeError').toEqual(model(500, 'INTERNAL', 'errors.internal', {}, 'req-4'));
  expect(mapped('boom', 'req-5'), 'answer for a thrown text').toEqual(model(500, 'INTERNAL', 'errors.internal', {}, 'req-5'));
});

test('over HTTP every failure has one shape and the request id of its header', async () => {
  const base = await listen(createApp());
  const calls = [
    [400, 'POST', '/expenses', { id: 'e-07', amountMinor: -500 }],
    [404, 'GET', '/expenses/e-99'],
    [409, 'POST', '/expenses', { id: 'e-01', amountMinor: 84550 }],
    [500, 'GET', '/expenses/e-03/receipt'],
  ];
  for (const [status, method, path, body] of calls) {
    const response = await request(`${base}${path}`, { method, body });
    expect(response.status, `status of ${method} ${path}`).toBe(status);
    expect(Object.keys(response.json?.error ?? {}).sort(), `keys of error in ${method} ${path}`).toEqual(['code', 'details', 'messageKey', 'requestId']);
    expect(response.json.error.requestId, `requestId of ${method} ${path}`).toBe(response.headers['x-request-id']);
  }
});
