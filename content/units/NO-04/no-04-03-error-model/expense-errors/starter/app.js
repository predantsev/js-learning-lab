// The expenses API. Handlers only throw domain errors; one central handler turns every error
// into a response through toErrorResponse (read-only: you edit to-error-response.js).
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from './errors.js';
import { readJsonBody, sendJson } from './http-helpers.js';
import { toErrorResponse } from './to-error-response.js';

export function createApp() {
  // A fresh store for every app.
  const expenses = [
    { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  ];

  async function handle(request, response) {
    const parts = new URL(request.url, 'http://localhost').pathname.split('/').filter((part) => part !== '');
    if (parts[0] !== 'expenses') throw new NotFoundError(parts.join('/'));

    if (parts.length === 1 && request.method === 'POST') {
      // The client chooses the id (an app that works offline creates ids itself).
      const body = (await readJsonBody(request)) ?? {};
      const fields = {};
      if (typeof body.id !== 'string' || body.id === '') fields.id = 'required';
      if (!Number.isInteger(body.amountMinor) || body.amountMinor <= 0) fields.amountMinor = 'notPositive';
      if (Object.keys(fields).length > 0) throw new ValidationError(fields);
      if (expenses.some((expense) => expense.id === body.id)) throw new ConflictError(body.id);
      const expense = { label: '', date: '2026-03-02', category: 'food', ...body };
      expenses.push(expense);
      return sendJson(response, 201, expense);
    }

    const expense = expenses.find((item) => item.id === parts[1]);
    if (!expense) throw new NotFoundError(parts[1]);
    if (parts.length === 2 && request.method === 'GET') return sendJson(response, 200, expense);
    if (parts[2] === 'receipt' && request.method === 'GET') {
      // A bug: no expense has a receipt, so this reads .url of undefined and throws a TypeError.
      return sendJson(response, 200, { url: expense.receipt.url });
    }
    throw new NotFoundError(parts.join('/'));
  }

  return http.createServer((request, response) => {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    handle(request, response).catch((error) => {
      const { status, body } = toErrorResponse(error, requestId);
      // The full error stays in the server's own log, next to the request id.
      if (status >= 500) console.error(`[${requestId}]`, error);
      sendJson(response, status, body);
    });
  });
}
