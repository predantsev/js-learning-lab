// CORS for the planner API as a wrapper around any request handler.
export const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE';
export const ALLOWED_HEADERS = 'content-type, idempotency-key';

// cors({ allowedOrigins, allowCredentials }) returns wrap(handler) → a new handler.
export function cors({ allowedOrigins, allowCredentials = false }) {
  return (handler) => (request, response) => {
    const origin = request.headers.origin;
    // The answer depends on Origin, so caches must keep one copy per Origin.
    response.setHeader('vary', 'Origin');
    const allowed = origin !== undefined && allowedOrigins.includes(origin);
    if (allowed) {
      response.setHeader('access-control-allow-origin', origin);
      if (allowCredentials) response.setHeader('access-control-allow-credentials', 'true');
    }
    const isPreflight = request.method === 'OPTIONS' && request.headers['access-control-request-method'] !== undefined;
    if (isPreflight) {
      // Mistake: hands the allowed methods and headers to every preflight, whatever its origin.
      response.setHeader('access-control-allow-methods', ALLOWED_METHODS);
      response.setHeader('access-control-allow-headers', ALLOWED_HEADERS);
      response.writeHead(204);
      return response.end();
    }
    return handler(request, response);
  };
}
