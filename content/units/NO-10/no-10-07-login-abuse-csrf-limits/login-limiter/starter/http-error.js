// An error that already knows its HTTP status and stable code (read-only).
export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}
