/**
 * @module controllers/auth
 *
 * The §28 auth surface: register, login, refresh, logout, profile,
 * avatar, and the §28.6 Google stub. Token signing and the §28.2
 * cookie mechanics live here (the §15.4 tree has no separate token
 * utility path); the JWT payload is `{ sub, type }`, cookies carry
 * the exact §28.2 attributes, and refresh rotation is pure cookie
 * mechanics (no server-side session store, §28.2 — a presented
 * refresh token is simply replaced, never blacklisted; reuse is
 * not detected, documented acceptance). Avatar files land in
 * `backend/uploads/avatar/` (§28.5, gitignored) via multer and are
 * served only through the auth'd `GET /auth/avatar` — never via a
 * public static mount (§26.4). Controllers forward errors with
 * `next(error)` — no layer responds directly (§27.5). JWT values
 * and passwords are never logged (ADR-019) and never appear in any
 * response DTO (§28.8).
 */
import { mkdirSync, unlinkSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import { env } from '../config/env.js';
import User from '../models/user.model.js';
import {
  ACCESS_TOKEN_TTL_MIN,
  REFRESH_TOKEN_TTL_DAYS,
  AVATAR_MAX_SIZE_BYTES,
  AVATAR_ALLOWED_MIME_TYPES,
  MONGO_DUPLICATE_KEY_ERROR_CODE,
} from '../utils/constants.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

/** §28.2 cookie attributes — shared by set and clear. */
const accessCookieAttrs = {
  path: '/api/v1',
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
};
const refreshCookieAttrs = {
  path: '/api/v1/auth',
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
};

/** Avatar file extensions keyed by MIME (the §11.3 constant list). */
const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
/** Reverse lookup for serving — §28.3 (`Content-Type` from `AVATAR_ALLOWED_MIME_TYPES`). */
const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const AVATAR_DIR = 'uploads/avatar';
const CACHE_CONTROL = 'private, max-age=300';

function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_MIN * 60,
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...accessCookieAttrs,
    maxAge: ACCESS_TOKEN_TTL_MIN * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...refreshCookieAttrs,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, accessCookieAttrs);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieAttrs);
}

/**
 * §19 name derivation: `firstName`/`lastName` come from the email
 * local part — `beza` → beza/beza; `beza.ayalew` → beza/ayalew
 * (multi-part locals: first segment + remainder joined by `.`).
 * @param {string} email - Normalized email.
 * @returns {{ firstName: string, lastName: string }}
 */
function deriveName(email) {
  const local = email.split('@')[0];
  const parts = local.split('.');
  const firstName = parts[0];
  const lastName = parts.slice(1).join('.') || firstName;
  return { firstName, lastName };
}

/**
 * UserDto mapper (ADR-017, §28.3): consumes only the model's
 * serialized surface — the `toJSON` transform (password/`id`/`__v`
 * stripped, `fullName` present via virtuals, §19.5). Mongoose 9 has
 * no built-in lean virtuals, so read paths hand full documents to
 * this mapper (§27.7 clarification, 2026-08-19).
 * @param {object} doc - Mongoose document.
 * @returns {object} The `{ _id, email, firstName, lastName,
 *   fullName, avatar, position, createdAt, updatedAt }` DTO.
 */
function toUserDto(doc) {
  const data = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    _id: data._id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: data.fullName,
    avatar: data.avatar,
    position: data.position,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Best-effort file cleanup (two-phase write hygiene, §28.5). */
function unlinkQuietly(filePath) {
  try {
    unlinkSync(filePath);
  } catch {
    // Leftover files are harmless; the upload dir is gitignored.
  }
}

/**
 * Avatar upload (§28.5): disk storage under `backend/uploads/avatar/`
 * (runtime-created, gitignored), MIME gate from
 * `AVATAR_ALLOWED_MIME_TYPES`, size gate from
 * `AVATAR_MAX_SIZE_BYTES`. Rejected MIMEs raise a 422 CustomError
 * with the §29 details shape; size violations surface as multer's
 * `LIMIT_FILE_SIZE` (mapped by `utils/errors.js`).
 */
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      mkdirSync(AVATAR_DIR, { recursive: true });
      cb(null, AVATAR_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${req.user._id.toString()}${EXTENSION_BY_MIME[file.mimetype]}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(
        new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
          { field: 'avatar', message: 'Avatar must be a JPEG, PNG, or WebP image' },
        ]),
      );
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: AVATAR_MAX_SIZE_BYTES },
});

/**
 * POST /auth/register — no cookies, no auto-login (locked decision
 * 9, §41.2). Names derive from the email local part (§19); the
 * unique-email 11000 surfaces as 409 CONFLICT with the §28.3 copy.
 */
const register = asyncHandler(async (req, res, next) => {
  const { email, password } = req.validated.body;
  const { firstName, lastName } = deriveName(email);
  const user = new User({ email, password, firstName, lastName });

  try {
    await user.save();
  } catch (err) {
    if (err.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
      next(new CustomError('CONFLICT', 'An account with this email already exists'));
      return;
    }
    next(err);
    return;
  }

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Account created',
    data: { user: toUserDto(user) },
  });
});

/**
 * POST /auth/login — 401 is identical for unknown email and wrong
 * password (no user enumeration, §28.3); there is no dummy-compare
 * (documented acceptance). Success sets both §28.2 cookies.
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password');
  const valid = user !== null && (await user.comparePassword(password));

  if (!valid) {
    next(new CustomError('UNAUTHORIZED', 'Incorrect email or password'));
    return;
  }

  setAuthCookies(res, signAccessToken(user._id), signRefreshToken(user._id));
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Welcome back',
    data: { user: toUserDto(user) },
  });
});

/**
 * POST /auth/refresh — rotation: every successful refresh issues a
 * new refresh JWT (fresh `exp`) plus a fresh access token (§28.2);
 * any failure clears both cookies and 401s with the §28.3 copy.
 */
const refresh = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    clearAuthCookies(res);
    next(new CustomError('UNAUTHORIZED', 'Session expired — sign in again'));
    return;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    clearAuthCookies(res);
    next(new CustomError('UNAUTHORIZED', 'Session expired — sign in again'));
    return;
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    clearAuthCookies(res);
    next(new CustomError('UNAUTHORIZED', 'Session expired — sign in again'));
    return;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookies(res);
    next(new CustomError('UNAUTHORIZED', 'Session expired — sign in again'));
    return;
  }

  setAuthCookies(res, signAccessToken(user._id), signRefreshToken(user._id));
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Session refreshed',
    data: { user: toUserDto(user) },
  });
});

/** POST /auth/logout — idempotent, no auth required; clears both cookies (§28.3). */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.status(httpStatus.OK).json({ success: true, message: 'Signed out', data: null });
});

/**
 * PATCH /auth/profile — JSON `{ position?, firstName?, lastName? }`
 * or multipart `avatar`. Name renames stand after any manual
 * rename (no derived-lock guard, §28.5/§19); the avatar write is
 * two-phase: file first, then the document update, with best-effort
 * cleanup of the new file on failure and of the previous file on
 * success.
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const updates = {};
  if (body.position !== undefined) updates.position = body.position;
  if (body.firstName !== undefined) updates.firstName = body.firstName;
  if (body.lastName !== undefined) updates.lastName = body.lastName;

  if (req.file) {
    const avatarPath = `${AVATAR_DIR}/${req.file.filename}`;
    const previous = await User.findById(req.user._id).lean();
    updates.avatar = avatarPath;
    try {
      const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
        new: true,
        runValidators: true,
      });
      if (previous && previous.avatar && previous.avatar !== avatarPath) {
        unlinkQuietly(resolve(process.cwd(), previous.avatar));
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: 'Profile updated',
        data: { user: toUserDto(updated) },
      });
    } catch (err) {
      unlinkQuietly(resolve(process.cwd(), avatarPath));
      next(err);
    }
    return;
  }

  const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
    new: true,
    runValidators: true,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Profile updated',
    data: { user: toUserDto(updated) },
  });
});

/**
 * GET /auth/avatar — streams the avatar image with the §28.3
 * `Content-Type` and a set `Cache-Control`; a missing file is the
 * same 404 as a missing avatar (the DB row and the file can drift
 * only through external deletion).
 */
const getAvatar = asyncHandler(async (req, res, next) => {
  const avatar = req.user.avatar;
  if (!avatar) {
    next(new CustomError('NOT_FOUND', 'No avatar'));
    return;
  }

  const filePath = resolve(process.cwd(), avatar);
  const mime = MIME_BY_EXTENSION[extname(avatar)];
  res.set('Content-Type', mime ?? 'application/octet-stream');
  res.set('Cache-Control', CACHE_CONTROL);
  res.sendFile(filePath, (err) => {
    if (!err) return;
    if (err.code === 'ENOENT') {
      next(new CustomError('NOT_FOUND', 'No avatar'));
      return;
    }
    next(err);
  });
});

/** GET /auth/google — §28.6 stub; real OAuth is an open question (§69, OQ-004). */
const googleStub = asyncHandler(async (req, res, next) => {
  next(new CustomError('NOT_FOUND', 'Google sign-in is not available in this version'));
});

export { register, login, refresh, logout, updateProfile, getAvatar, googleStub, avatarUpload };