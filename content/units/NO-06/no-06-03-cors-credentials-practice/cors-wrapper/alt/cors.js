// CORS for the planner API as a wrapper around any request handler (a Set, and 403 for unknown preflights).
export const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE';
export const ALLOWED_HEADERS = 'content-type, idempotency-key';

export function cors({ allowedOrigins, allowCredentials = false }) {
  const origins = new Set(allowedOrigins);
  return (handler) => async (request, response) => {
    const origin = request.headers.origin ?? '';
    const permitted = origins.has(origin);
    const headers = { vary: 'Origin' };
    if (permitted) headers['access-control-allow-origin'] = origin;
    if (permitted && allowCredentials) headers['access-control-allow-credentials'] = 'true';

    if (request.method === 'OPTIONS' && request.headers['access-control-request-method']) {
      if (!permitted) {
        response.writeHead(403, headers);
        return response.end();
      }
      response.writeHead(204, {
        ...headers,
        'access-control-allow-methods': ALLOWED_METHODS,
        'access-control-allow-headers': ALLOWED_HEADERS,
      });
      return response.end();
    }
    for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
    await handler(request, response);
  };
}
