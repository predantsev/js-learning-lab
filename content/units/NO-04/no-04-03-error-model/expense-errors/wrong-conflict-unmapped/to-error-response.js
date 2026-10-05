// Mistake: the conflict is not mapped, so a duplicate id looks like a server bug (500).
import { NotFoundError, ValidationError } from './errors.js';

export function toErrorResponse(error, requestId) {
  const answer = (status, code, messageKey, details) => ({ status, body: { error: { code, messageKey, details, requestId } } });

  if (error instanceof ValidationError) return answer(400, 'VALIDATION_FAILED', 'errors.validationFailed', error.fields);
  if (error instanceof NotFoundError) return answer(404, 'NOT_FOUND', 'errors.notFound', { id: error.id });
  return answer(500, 'INTERNAL', 'errors.internal', {});
}
