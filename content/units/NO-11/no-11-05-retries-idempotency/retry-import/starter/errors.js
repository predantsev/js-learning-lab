// A problem with the data itself: repeating the same step cannot fix it.
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
