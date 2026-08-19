/**
 * @module routes/index
 *
 * The single route registry (§12.2-7, §26.5): every per-domain route
 * module of §28–§39 mounts here under `/api/v1` in the §15.4/§30–§39
 * order. `app.js` calls exactly one function (`app.use('/api/v1',
 * routes)`) — adding a route module anywhere else violates the
 * registry (grep gate: one `/api/v1` mount in `app.js`). The health
 * endpoint is defined here (§26.6): unauthenticated, excluded from the
 * rate-limit tiers, never touches the database.
 */
import { Router } from 'express';
import { httpStatus } from '../utils/httpStatus.js';
import authRoutes from './auth.routes.js';

const routes = Router();

routes.get('/health', (req, res) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'OK',
    data: { status: 'up', uptime: process.uptime() },
  });
});

// Domain modules mount here in §15.4 order:
// auth, branches, reports, audio, transcription, chat, export,
// analytics, search, mock.
routes.use('/auth', authRoutes);

export default routes;
