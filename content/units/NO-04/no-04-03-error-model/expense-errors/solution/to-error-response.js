// Maps any thrown value to an HTTP status and the API's one error shape:
//   { status, body: { error: { code, messageKey, details, requestId } } }
import { ConflictError, NotFoundError, ValidationError } from './errors.js';

export function toErrorResponse(error, requestId) {
  const answer = (status, code, messageKey, details) => ({ status, body: { error: { code, messageKey, details, requestId } } });

  if (error instanceof ValidationError) return answer(400, 'VALIDATION_FAILED', 'errors.validationFailed', error.fields);
  if (error instanceof NotFoundError) return answer(404, 'NOT_FOUND', 'errors.notFound', { id: error.id });
  if (error instanceof ConflictError) return answer(409, 'CONFLICT', 'errors.conflict', { id: error.id });
  // Anything else is our bug: the client gets a stable code, never the message or the stack.
  return answer(500, 'INTERNAL', 'errors.internal', {});
}
