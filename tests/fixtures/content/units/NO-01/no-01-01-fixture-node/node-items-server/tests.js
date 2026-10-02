// Real HTTP requests to the learner's server: listen() starts it on a free loopback port.
import { createApp } from './app.js';

test('GET /items answers 200 with the items as JSON', async () => {
  const base = await listen(createApp());
  const response = await request(`${base}/items`);
  expect(response.status, 'status of GET /items').toBe(200);
  expect(response.json, 'body of GET /items').toEqual([{ id: 1, name: L.lamp }, { id: 2, name: L.plant }]);
});

test('the answer says it is JSON', async () => {
  const base = await listen(createApp());
  const response = await request(`${base}/items`);
  expect(response.headers['content-type'] ?? '', 'content-type of GET /items').toMatch(/^application\/json/);
});

test('an unknown address answers 404', async () => {
  const base = await listen(createApp());
  const response = await request(`${base}/missing`);
  expect(response.status, 'status of GET /missing').toBe(404);
});
