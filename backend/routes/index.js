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
import { env } from '../config/env.js';
import authRoutes from './auth.routes.js';
import branchRoutes from './branch.routes.js';
import reportRoutes from './report.routes.js';
import audioRoutes from './audio.routes.js';
import transcriptionRoutes from './transcription.routes.js';
import chatRoutes from './chat.routes.js';
import exportRoutes from './export.routes.js';
import analyticsRoutes from './analytics.routes.js';
import searchRoutes from './search.routes.js';
import mockRoutes from './mock.routes.js';

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
routes.use('/branches', branchRoutes);
routes.use('/reports', reportRoutes);
routes.use(audioRoutes);
routes.use(transcriptionRoutes);
routes.use(chatRoutes);
routes.use(exportRoutes);
routes.use('/analytics', analyticsRoutes);
routes.use('/search', searchRoutes);

// The §40.5 conditional mount — the ONE development check in the
// codebase (the frozen config, §26.2): outside development the mock
// routes do not exist and any call falls through to the §27.5 404
// handler (no guard middleware, no mock-specific copy).
if (env.NODE_ENV === 'development') {
  routes.use('/mock', mockRoutes);
}

export default routes;
