// Helpers for reading and sending JSON with node:http (unit NO-03 showed how they work).

// Sends a value as JSON with an explicit status, type and length.
export function sendJson(response, status, value) {
  const text = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
  });
  response.end(text);
}

// Sends a status with no body (for example 204 No Content).
export function sendEmpty(response, status) {
  response.writeHead(status);
  response.end();
}

// Reads the request body chunk by chunk, up to maxBytes, and parses it as JSON.
// An empty body gives undefined.
export async function readJsonBody(request, maxBytes = 10_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('body too large'), { status: 413 });
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('malformed JSON'), { status: 400 });
  }
}
