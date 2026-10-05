// Helpers for node:http (read-only).

// Sends a value as JSON with a status and optional extra headers.
export function sendJson(response, status, value, headers = {}) {
  const text = value === undefined ? '' : JSON.stringify(value);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(text);
}

// Sends the error shape { error: { code, details } }.
export function sendError(response, status, code, headers = {}) {
  sendJson(response, status, { error: { code, details: {} } }, headers);
}

// Reads a JSON body of at most maxBytes. Throws an error with status 413 (too large)
// or 400 (not JSON); an empty body gives undefined.
export async function readJsonBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('body too large'), { status: 413, code: 'PAYLOAD_TOO_LARGE' });
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('malformed JSON'), { status: 400, code: 'MALFORMED_JSON' });
  }
}
