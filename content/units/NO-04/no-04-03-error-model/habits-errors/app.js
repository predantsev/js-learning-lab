// A habits API whose failures each answer in their own shape — and the unexpected one leaks its stack.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readJsonBody, sendJson } from './http-helpers.js';

export function createApp() {
  // A fresh store for every app.
  const habits = [
    { id: 'h-01', name: '%%exercise%%', completions: ['2026-02-28', '2026-03-01'] },
    { id: 'h-06', name: '%%walk%%', completions: [] },
  ];

  async function handle(request, response) {
    const parts = new URL(request.url, 'http://localhost').pathname.split('/').filter((part) => part !== '');

    if (parts[0] === 'habits' && parts.length === 1 && request.method === 'POST') {
      const body = (await readJsonBody(request)) ?? {};
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return sendJson(response, 400, { message: 'name is required' });
      }
      if (habits.some((habit) => habit.name === body.name.trim())) {
        response.writeHead(409, { 'content-type': 'text/plain' });
        return response.end('duplicate');
      }
      const habit = { id: `h-${String(habits.length + 1).padStart(2, '0')}`, name: body.name.trim(), completions: [] };
      habits.push(habit);
      return sendJson(response, 201, habit);
    }

    const habit = habits.find((item) => item.id === parts[1]);
    if (parts[0] === 'habits' && !habit) return sendJson(response, 404, { error: `Habit ${parts[1]} not found` });

    if (parts.length === 3 && parts[2] === 'last-done' && request.method === 'GET') {
      // A bug: a habit that was never done has no last completion, and .slice() of undefined throws.
      const lastMonth = habit.completions.at(-1).slice(0, 7);
      return sendJson(response, 200, { id: habit.id, lastMonth });
    }
    return sendJson(response, 404, { error: 'no route' });
  }

  return http.createServer((request, response) => {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    // The central handler: every error thrown by `handle` ends up here.
    handle(request, response).catch((error) => {
      sendJson(response, 500, { error: error.message, stack: error.stack });
    });
  });
}
