// Helpers for reading and sending JSON with node:http (read-only).

// Sends a value as JSON with an explicit status, type and length.
export function sendJson(response, status, value, headers = {}) {
  const text = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    ...headers,
  });
  response.end(text);
}

// Reads the whole body as text. Past maxBytes the rest is read and thrown away (so the client can
// still receive an answer), and the promise rejects with an error whose status is 413.
export async function readBodyText(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= maxBytes) chunks.push(chunk);
  }
  if (size > maxBytes) throw Object.assign(new Error('body too large'), { status: 413 });
  return Buffer.concat(chunks).toString('utf8');
}
