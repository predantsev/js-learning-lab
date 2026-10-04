// Another valid solution: a table of known error kinds, searched with find + instanceof.
import { ConflictError, NotFoundError, ValidationError } from './errors.js';

const KNOWN = [
  { type: ValidationError, status: 400, code: 'VALIDATION_FAILED', messageKey: 'errors.validationFailed', details: (e) => e.fields },
  { type: NotFoundError, status: 404, code: 'NOT_FOUND', messageKey: 'errors.notFound', details: (e) => ({ id: e.id }) },
  { type: ConflictError, status: 409, code: 'CONFLICT', messageKey: 'errors.conflict', details: (e) => ({ id: e.id }) },
];
const INTERNAL = { status: 500, code: 'INTERNAL', messageKey: 'errors.internal', details: () => ({}) };

export function toErrorResponse(error, requestId) {
  const kind = KNOWN.find((entry) => error instanceof entry.type) ?? INTERNAL;
  return {
    status: kind.status,
    body: { error: { code: kind.code, messageKey: kind.messageKey, details: kind.details(error), requestId } },
  };
}
