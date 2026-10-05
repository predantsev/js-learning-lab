import { HttpError } from './errors.js';

// Read the request body as JSON, never keeping more than maxBytes bytes of it.
// Resolves with the parsed value; rejects with HttpError(413, …) when the body is over the limit
// and with HttpError(400, …) when it is not valid JSON.
export function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      chunks.push(chunk);
    };
    const onEnd = () => {
      if (size > maxBytes) return reject(new HttpError(413, 'body too large'));
      const text = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new HttpError(400, 'malformed JSON'));
      }
    };
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', reject);
  });
}
