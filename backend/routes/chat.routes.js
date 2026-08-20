/**
 * @module routes/chat
 *
 * The §36 route module, mounted by the §26.5 registry at `/api/v1`
 * with its own full path segments (`/reports/:reportId/chat` and
 * `/reports/:reportId/chat/messages`). Every endpoint requires the
 * access cookie (§28.4). Tier split per §36.7: the conversation READ
 * is global tier (it must never hit the 10/min AI limiter — the
 * `isTieredPath` rule is method-aware for chat, §27.3), the message
 * APPEND is ai tier (route-level `aiLimiter` on the POST only).
 * **`authenticate` is per-route, never router-wide** — this router
 * mounts at the registry root with full path segments; a router-wide
 * `authenticate` would 401 every unmatched `/api/v1/*` request
 * instead of letting it reach the §27.5 404 handler.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { getConversationHandler, postMessage } from '../controllers/chat.controller.js';
import { reportIdParam, messageChain } from '../validators/chat.validator.js';
import { validate } from '../validators/validation.js';

const chatRoutes = Router();

chatRoutes.get('/reports/:reportId/chat', authenticate, reportIdParam, validate, getConversationHandler);
chatRoutes.post('/reports/:reportId/chat/messages', authenticate, reportIdParam, aiLimiter, messageChain, validate, postMessage);

export default chatRoutes;