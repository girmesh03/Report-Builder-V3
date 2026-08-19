/**
 * @module app
 *
 * The Express app (§26.4). Registers no route directly (§12.2-7) —
 * only `routes/index.js` does. Fixed middleware order (ADR-035, §27.2),
 * never reordered, never dropped: helmet → cors → compression →
 * cookie-parser → express.json → express-mongo-sanitize → rate-limit,
 * then the `/api/v1` registry mount (§26.5), then the not-found
 * handler and the global error handler (both §27.5). CORS per §12.3:
 * origin `CLIENT_ORIGIN`, `credentials: true` — httpOnly cookies travel
 * with requests. Nothing else is mounted: no public static mount
 * (uploads are service-internal, §32; the avatar is served only
 * through the authenticated `GET /auth/avatar` route, §28.5), no
 * provider proxy routes (backend-only proxy = service layer, §16).
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import mongoSanitize from './middleware/mongoSanitize.js';
import routes from './routes/index.js';
import { toErrorEnvelope } from './utils/errors.js';
import { logger } from './utils/logger.js';
import { httpStatus } from './utils/httpStatus.js';

export const app = express();

app.disable('x-powered-by');

// Fixed middleware chain (ADR-035, §26.4/§27.2 order — never reordered).
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(compression());
app.use(cookieParser());
// The JSON body parser precedes the sanitizer so $/. operator keys in
// bodies are stripped before validation (§27.2).
app.use(express.json());
app.use(mongoSanitize());
app.use(globalLimiter);

// The single route registry mount (§26.5).
app.use('/api/v1', routes);

// Not-found handler (§27.5): any unmatched path.
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    data: null,
  });
});

// Global error handler (§27.5): single (err, req, res, next) at the
// end. Logs the error class, status, and request reference — never
// the error message verbatim when it could contain user text
// (safe-logging policy, ADR-019). Stack trace rendered only in
// development.
app.use((err, req, res, next) => {
  const { statusCode, status, body } = toErrorEnvelope(err);
  const ref = `[${status}] ${err.name || 'Error'} @ ${req.method} ${req.originalUrl}`;
  if (env.NODE_ENV !== 'production' && err.stack) {
    logger.error(`${ref}\n${err.stack}`);
  } else {
    logger.error(ref);
  }
  res.status(statusCode).json(body);
});