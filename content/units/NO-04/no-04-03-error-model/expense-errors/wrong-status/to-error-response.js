// Mistake: a missing record is answered as a bad request (400) instead of 404.
import { ConflictError, NotFoundError, ValidationError } from './errors.js';

export function toErrorResponse(error, requestId) {
  const answer = (status, code, messageKey, details) => ({ status, body: { error: { code, messageKey, details, requestId } } });

  if (error instanceof ValidationError) return answer(400, 'VALIDATION_FAILED', 'errors.validationFailed', error.fields);
  if (error instanceof NotFoundError) return answer(400, 'NOT_FOUND', 'errors.notFound', { id: error.id });
  if (error instanceof ConflictError) return answer(409, 'CONFLICT', 'errors.conflict', { id: error.id });
  return answer(500, 'INTERNAL', 'errors.internal', {});
}
