/**
 * @module utils/httpStatus
 *
 * Semantic HTTP status names (§11.6). Status codes are consumed by
 * semantic name only — numeric literals are banned on both sides.
 * Any additional code used later must be added here with a named key
 * before it is referenced (§11.6).
 *
 * @type {readonly Object<string, number>}
 */
export const httpStatus = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
});