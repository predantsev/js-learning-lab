// toPublicError(error, requestId): what a client may see of any failure — the stable error model
// of unit NO-04, built only from fields we chose. Nothing from error.message or error.stack.
export function toPublicError(error, requestId) {
  if (error?.code === 'ENOENT') {
    return { status: 404, body: { error: { code: 'NOT_FOUND', messageKey: 'errors.notFound', details: {}, requestId } } };
  }
  return { status: 500, body: { error: { code: 'INTERNAL', messageKey: 'errors.internal', details: {}, requestId } } };
}
