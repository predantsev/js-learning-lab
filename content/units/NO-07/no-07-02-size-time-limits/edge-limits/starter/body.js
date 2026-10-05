// Reading a JSON body with a byte limit (read-only; unit NO-03 showed how such a reader works).
// It throws typed errors, so the edge of the server decides which status each one gets.

export class PayloadTooLargeError extends Error {
  constructor(limit) {
    super(`body over ${limit} bytes`);
    this.name = 'PayloadTooLargeError';
    this.limit = limit;
  }
}

export class MalformedJsonError extends Error {
  constructor() {
    super('malformed JSON');
    this.name = 'MalformedJsonError';
  }
}

// Counts the real bytes of every chunk. Past maxBytes it stops reading (the rest of the body stays
// unread) and rejects with PayloadTooLargeError. An empty body gives undefined.
export function readJsonBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        request.off('data', onData);
        request.off('end', onEnd);
        request.pause();
        reject(new PayloadTooLargeError(maxBytes));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (text === '') return resolve(undefined);
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new MalformedJsonError());
      }
    };
    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', reject);
  });
}
