import { HttpError } from './errors.js';

// Read the request body as JSON, never keeping more than maxBytes bytes of it.
// Resolves with the parsed value; rejects with HttpError(413, …) when the body is over the limit
// and with HttpError(400, …) when it is not valid JSON.
export async function readJsonBody(req, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > maxBytes) throw new HttpError(413, 'body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
