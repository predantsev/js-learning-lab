// The wishlist service: GET /records?sort=name&limit=N answers the first N wishes by name.
// It has three suspects for a slow response: a file read, a sort and JSON serialization.
import http from 'node:http';
import { readFile } from 'node:fs/promises';

function compareNames(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

function sortByName(wishes) {
  return wishes.toSorted(compareNames);
}

// The first `limit` wishes in name order.
function listByName(wishes, limit) {
  const page = [];
  for (let i = 0; i < limit && i < wishes.length; i++) {
    const sorted = sortByName(wishes);
    page.push(sorted[i]);
  }
  return page;
}

export function createService(wishes, settingsFile) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname !== '/records' || url.searchParams.get('sort') !== 'name') {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    const settings = JSON.parse(await readFile(settingsFile, 'utf8'));
    const limit = Number(url.searchParams.get('limit') ?? settings.pageSize);
    const body = JSON.stringify(listByName(wishes, limit));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(body);
  });
}
