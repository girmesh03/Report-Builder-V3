/**
 * @module middleware/auth
 *
 * Route protection (§28.4, §15.4 middleware/). `authenticate` reads
 * the `accessToken` httpOnly cookie, verifies the JWT (secret,
 * type `access`, expiry via `jwt.verify`), loads the user by `sub`
 * as a full document (never `select('+password')` — the `toJSON`
 * transform strips the hash; Mongoose 9 has no built-in lean
 * virtuals, so `fullName` comes from the document's virtual getter,
 * §18.4), and attaches
 * `req.user = { _id, email, firstName, lastName, fullName, avatar,
 * position }`. Any failure — missing token, bad signature, expired,
 * wrong type, deleted user — is a single 401. There is no
 * `optionalAuth` (its only consumer, `GET /auth/me`, was removed,
 * §69.3.1). Controllers read `req.user._id` and never parse cookies
 * themselves (§28.4).
 */
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { env } from '../config/env.js';
import User from '../models/user.model.js';
import { CustomError } from '../utils/errors.js';

const UNAUTHORIZED = new CustomError('UNAUTHORIZED', 'Sign in to continue');

/**
 * Verifies the access-token cookie and attaches `req.user` (§28.4).
 * @type {import('express').RequestHandler}
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    next(UNAUTHORIZED);
    return;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    next(UNAUTHORIZED);
    return;
  }

  if (payload.type !== 'access' || !payload.sub) {
    next(UNAUTHORIZED);
    return;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    next(UNAUTHORIZED);
    return;
  }

  req.user = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    avatar: user.avatar,
    position: user.position,
  };
  next();
});