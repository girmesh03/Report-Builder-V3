/**
 * @module routes/analytics
 *
 * The §38 route module, mounted by the §26.5 registry at
 * `/api/v1/analytics` — a **path-scoped** mount (its prefix only
 * matches its own paths, so the router-wide `authenticate` is safe,
 * unlike the root-mounted routers of §32/§33/§36 — the §27.5 404
 * envelope is preserved). Both endpoints sit on the global tier
 * (§27.3) and require the access cookie (§28.4).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboard, getItems } from '../controllers/analytics.controller.js';
import { itemsQuery } from '../validators/analytics.validator.js';
import { validate } from '../validators/validation.js';

const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);

analyticsRoutes.get('/dashboard', getDashboard);
analyticsRoutes.get('/items', itemsQuery, validate, getItems);

export default analyticsRoutes;