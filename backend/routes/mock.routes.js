/**
 * @module routes/mock
 *
 * The §40 development-only route module — `POST /seed` + `POST
 * /wipe` (access, §40.2). **Mounted by `routes/index.js` only when
 * `NODE_ENV` is `development`** (§40.5 — the single conditional
 * mount in the codebase; outside development the routes do not
 * exist and any call falls through to the §27.5 404 handler — no
 * guard middleware, no mock-specific copy). This module is the
 * **only** caller of `mock/seed` and `mock/wipe` (§40.7 gate). No
 * body — no rule chains needed.
 */
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate } from '../middleware/auth.js';
import { httpStatus } from '../utils/httpStatus.js';
import { seed } from '../mock/seed.js';
import { wipe } from '../mock/wipe.js';

const mockRoutes = Router();

mockRoutes.use(authenticate);

mockRoutes.post('/seed', asyncHandler(async (req, res) => {
  const result = await seed(req.user._id);
  res.status(httpStatus.OK).json({ success: true, message: 'Mock data seeded', data: result });
}));

mockRoutes.post('/wipe', asyncHandler(async (req, res) => {
  const result = await wipe(req.user._id);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Mock data wiped',
    data: { wiped: result },
  });
}));

export default mockRoutes;