/**
 * @module routes/auth
 *
 * The §28 route module, mounted by the §26.5 registry at
 * `/api/v1/auth`. Every endpoint sits under the §27.3 auth tier
 * (the router-wide `authLimiter` — the global limiter already skips
 * `/api/v1/auth` paths). Route order per §28.3: register and login
 * skip `authenticate`; refresh reads the refresh cookie directly;
 * profile and avatar require the access cookie; the Google stub is
 * the §28.6 404. Chains mount before the controller with
 * `validate()` between them (§29.3); the avatar multer runs before
 * the profile chain so the at-least-one-field rule can see
 * `req.file` (§28.5).
 */
import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  refresh,
  logout,
  updateProfile,
  getAvatar,
  googleStub,
  avatarUpload,
} from '../controllers/auth.controller.js';
import { registerChain, loginChain, profileChain } from '../validators/user.validator.js';
import { validate } from '../validators/validation.js';

const authRoutes = Router();

authRoutes.use(authLimiter);

authRoutes.post('/register', registerChain, validate, register);
authRoutes.post('/login', loginChain, validate, login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.patch('/profile', authenticate, avatarUpload.single('avatar'), profileChain, validate, updateProfile);
authRoutes.get('/avatar', authenticate, getAvatar);
authRoutes.get('/google', googleStub);

export default authRoutes;