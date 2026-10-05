// CORS for the planner API as a wrapper around any request handler.
export const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE';
export const ALLOWED_HEADERS = 'content-type, idempotency-key';

// cors({ allowedOrigins, allowCredentials }) returns wrap(handler) → a new handler.
export function cors({ allowedOrigins, allowCredentials = false }) {
  return (handler) => (request, response) => {
    // TODO
    return handler(request, response);
  };
}
