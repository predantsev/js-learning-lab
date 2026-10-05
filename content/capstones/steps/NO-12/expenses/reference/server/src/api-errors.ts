// The error model of the /v1 API: every failure is one JSON shape
//   { "error": { "code", "messageKey", "details", "requestId" } }
// with the matching status. The code and the keys of `details` are the contract; a message text is not.
// An unexpected failure becomes INTERNAL with no message and no stack trace (they go to the terminal).

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "MALFORMED_JSON"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "IDEMPOTENCY_KEY_REUSED"
  | "IMPORT_BUSY"
  | "INTERNAL";

const MESSAGE_KEYS: Record<ErrorCode, string> = {
  VALIDATION_FAILED: "errors.validationFailed",
  MALFORMED_JSON: "errors.malformedJson",
  NOT_FOUND: "errors.notFound",
  METHOD_NOT_ALLOWED: "errors.methodNotAllowed",
  PAYLOAD_TOO_LARGE: "errors.payloadTooLarge",
  IDEMPOTENCY_KEY_REUSED: "errors.idempotencyKeyReused",
  IMPORT_BUSY: "errors.importBusy",
  INTERNAL: "errors.internal",
};

// A failure the API answers on purpose. It knows its status, code, details and extra headers (Allow).
export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details: Record<string, unknown>;
  headers: Record<string, string>;

  constructor(status: number, code: ErrorCode, details: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

export type ErrorResponse = {
  status: number;
  headers: Record<string, string>;
  body: { error: { code: ErrorCode; messageKey: string; details: Record<string, unknown>; requestId: string } };
};

// The one place that turns any thrown value into an answer.
export function toErrorResponse(error: unknown, requestId: string): ErrorResponse {
  if (error instanceof ApiError) {
    return { status: error.status, headers: error.headers, body: { error: { code: error.code, messageKey: MESSAGE_KEYS[error.code], details: error.details, requestId: requestId } } };
  }
  return { status: 500, headers: {}, body: { error: { code: "INTERNAL", messageKey: MESSAGE_KEYS.INTERNAL, details: {}, requestId: requestId } } };
}
