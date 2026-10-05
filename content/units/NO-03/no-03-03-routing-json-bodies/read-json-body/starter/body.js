import { HttpError } from './errors.js';

// Read the request body as JSON, never keeping more than maxBytes bytes of it.
// Resolves with the parsed value; rejects with HttpError(413, …) when the body is over the limit
// and with HttpError(400, …) when it is not valid JSON.
export function readJsonBody(req, maxBytes) {
  // TODO
  return Promise.resolve(null);
}
