// Maps any thrown value to an HTTP status and the API's one error shape:
//   { status, body: { error: { code, messageKey, details, requestId } } }
import { ConflictError, NotFoundError, ValidationError } from './errors.js';

export function toErrorResponse(error, requestId) {
  // TODO: choose the status, code, messageKey and details for each kind of error.
  return { status: 500, body: { error: error.message } };
}
