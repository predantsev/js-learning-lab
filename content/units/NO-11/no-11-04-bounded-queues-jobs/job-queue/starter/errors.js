// The error a full queue rejects with. A server turns it into 503 Service Unavailable.
export class QueueFull extends Error {
  constructor(message = 'the job queue is full') {
    super(message);
    this.name = 'QueueFull';
  }
}
