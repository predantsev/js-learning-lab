// Helpers for reading and sending JSON with node:http (units NO-03 and NO-04 showed how they work).

export function sendJson(response, status, value, headers = {}) {
  const text = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    ...headers,
  });
  response.end(text);
}

// Sends a status with no body (for example 204 No Content).
export function sendEmpty(response, status, headers = {}) {
  response.writeHead(status, headers);
  response.end();
}

// Every failure has one shape: { error: { code, details } }.
export function sendError(response, status, code, headers = {}) {
  sendJson(response, status, { error: { code, details: {} } }, headers);
}

// Reads a small JSON body (up to maxBytes); an empty or broken body gives undefined.
export async function readJsonBody(request, maxBytes = 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) return undefined;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

// An error that already knows its HTTP status and stable code.
export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}
