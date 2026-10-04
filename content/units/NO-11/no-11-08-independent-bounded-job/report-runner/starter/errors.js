// Errors of the report runner.
export class QueueFull extends Error {
  constructor(message = '%%queueFull%%') {
    super(message);
    this.name = 'QueueFull';
  }
}

export class ShutdownError extends Error {
  constructor(message = '%%shuttingDown%%') {
    super(message);
    this.name = 'ShutdownError';
  }
}
