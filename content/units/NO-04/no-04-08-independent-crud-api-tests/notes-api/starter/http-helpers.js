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

// Reads the whole body as text. Past maxBytes the rest is read and thrown away, and the promise
// rejects with an error whose status is 413. Reading to the end lets the client receive that answer:
// measured on Node.js 25 and 20, a reader that throws inside the loop instead still answered 413 for
// bodies up to 64 KB, but with a 1 MB body some requests met a reset connection or no answer at all.
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
