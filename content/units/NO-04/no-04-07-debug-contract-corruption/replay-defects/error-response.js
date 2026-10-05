// The wishlist API's error model (read-only).
// toErrorResponse(error, requestId) → { status, body: { error: { code, messageKey, details, requestId } } }
export class WishNotFound extends Error {
  constructor(id) {
    super(`wish ${id} not found`);
    this.name = 'WishNotFound';
    this.id = id;
  }
}

export function toErrorResponse(error, requestId) {
  if (error instanceof WishNotFound) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', messageKey: 'errors.notFound', details: { id: error.id }, requestId } } };
  }
  return { status: 500, body: { error: { code: 'INTERNAL', messageKey: 'errors.internal', details: {}, requestId } } };
}

export function validationResponse(errors, requestId) {
  return { status: 400, body: { error: { code: 'VALIDATION_FAILED', messageKey: 'errors.validationFailed', details: errors, requestId } } };
}
