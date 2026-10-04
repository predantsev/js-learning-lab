// Domain errors of the expenses API. They describe WHAT went wrong and know nothing about HTTP;
// the edge of the server decides which status and body each one gets.

export class ValidationError extends Error {
  constructor(fields) {
    super('validation failed');
    this.name = 'ValidationError';
    this.fields = fields; // for example { amountMinor: 'notPositive' }
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`expense ${id} not found`);
    this.name = 'NotFoundError';
    this.id = id;
  }
}

export class ConflictError extends Error {
  constructor(id) {
    super(`expense ${id} already exists`);
    this.name = 'ConflictError';
    this.id = id;
  }
}
