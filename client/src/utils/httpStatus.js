/**
 * @module utils/httpStatus
 *
 * Client mirror of the status-code semantics (§11.6). Status codes are
 * consumed by semantic name only — numeric literals are banned on both
 * sides; this file mirrors the backend mapping so the UI never holds a
 * numeric literal.
 *
 * @type {readonly Object<string, number>}
 */
export const httpStatus = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
});