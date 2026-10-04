// Helpers for sending JSON and errors with node:http (units NO-03 and NO-04 showed how they work).

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

// An error that already knows its HTTP status and stable code.
export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

// Every failure has one shape: { error: { code, details } }.
// A 401 also names the credential scheme the server expects (RFC 9110 requires
// WWW-Authenticate on 401; "Bearer" is the scheme from RFC 6750).
export function sendError(response, error) {
  if (!(error instanceof HttpError)) error = new HttpError(500, 'INTERNAL');
  const headers = error.status === 401 ? { 'www-authenticate': 'Bearer' } : {};
  sendJson(response, error.status, { error: { code: error.code, details: {} } }, headers);
}
