/**
 * @module utils/errors
 *
 * The error surface shared by every layer that raises an HTTP
 * response (§27.5, §15.4). `CustomError` carries the semantic status
 * name from `utils/httpStatus.js` (§11.6), the status code derived
 * from it, a user-facing `message`, and optional `details` for
 * validation field errors (§29). `toErrorEnvelope` maps any error to
 * the ADR-016 error envelope `{ success: false, message, data: null }`
 * plus `details` for 422 — used by the global handler in `app.js`.
 */
import { httpStatus } from './httpStatus.js';
import { MONGO_DUPLICATE_KEY_ERROR_CODE } from './constants.js';

/**
 * Application error with a semantic HTTP status.
 * @type {Error}
 */
export class CustomError extends Error {
  /**
   * @param {keyof typeof httpStatus} status - Semantic status name (§11.6).
   * @param {string} message - User-facing, plain-language message (§27.5).
   * @param {Array<{ field: string, message: string }>} [details] - Validation field errors (§29, 422 only).
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'CustomError';
    this.status = status;
    this.statusCode = httpStatus[status];
    this.details = details;
    if (this.statusCode === undefined) {
      throw new Error(`Unknown status name: ${status} — register it in utils/httpStatus.js first (§11.6)`);
    }
  }
}

/**
 * Maps any error to the error envelope consumed by the global handler.
 * @param {Error} err - The raised error.
 * @returns {{ statusCode: number, status: string, body: object }} The
 *   ADR-016 response body plus the code/name the handler needs.
 */
export function toErrorEnvelope(err) {
  if (err instanceof CustomError) {
    return {
      statusCode: err.statusCode,
      status: err.status,
      body: {
        success: false,
        message: err.message,
        data: null,
        ...(err.details ? { details: err.details } : {}),
      },
    };
  }

  if (err.name === 'ValidationError') {
    const details = Object.entries(err.errors).map(([field, e]) => ({ field, message: e.message }));
    return {
      statusCode: httpStatus.UNPROCESSABLE_ENTITY,
      status: 'UNPROCESSABLE_ENTITY',
      body: {
        success: false,
        message: 'Check the highlighted fields.',
        data: null,
        details,
      },
    };
  }

  if (err.type === 'entity.parse.failed' || err.statusCode === httpStatus.BAD_REQUEST) {
    return {
      statusCode: httpStatus.BAD_REQUEST,
      status: 'BAD_REQUEST',
      body: { success: false, message: 'Malformed request body.', data: null },
    };
  }

  if (err.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
    return {
      statusCode: httpStatus.CONFLICT,
      status: 'CONFLICT',
      body: { success: false, message: 'A record with this value already exists.', data: null },
    };
  }

  return {
    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    status: 'INTERNAL_SERVER_ERROR',
    body: { success: false, message: 'Something went wrong — please try again.', data: null },
  };
}