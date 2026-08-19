/**
 * Sub-phase 3 — Identity verification suite (§63.10).
 *
 * Terminal-visible contract: every check prints the request (method +
 * path) and the response status + full JSON body, then a PASS/FAIL
 * verdict. Non-HTTP checks print a UNIT line. The suite ends with
 * PASS=N FAIL=M and exits non-zero on any failure. Output goes through
 * process.stdout.write (no console.log literal — §9.5/§63.4 grep-gate
 * clean). Zero dependencies beyond Node 24 built-ins + the installed
 * jsonwebtoken (used only to forge expired/wrong-type tokens for the
 * §28.4 401 paths).
 *
 * Run: from backend/, with the dev server on :4000
 *   node scripts/test-03-identity.mjs
 *   node scripts/test-03-identity.mjs --only=login
 *
 * Auth-tier budget (§63.10 / §27.3): the auth tier allows 20 requests
 * per IP per 15 min, but a faithful edge matrix needs more — so the
 * suite runs per GROUP with a backend restart between groups (the
 * in-memory rate store resets on restart). The default invocation
 * covers the bootstrap group (unit + register, 8 HTTP requests) and
 * prints the per-group commands for the rest; `ratelimit` exhausts
 * the tier and MUST run last, in isolation:
 *   node scripts/test-03-identity.mjs            (unit + register)
 *   node scripts/test-03-identity.mjs --only=login
 *   node scripts/test-03-identity.mjs --only=refresh
 *   node scripts/test-03-identity.mjs --only=profile
 *   node scripts/test-03-identity.mjs --only=avatar
 *   node scripts/test-03-identity.mjs --only=misc
 *   node scripts/test-03-identity.mjs --only=ratelimit
 *
 * Safety (ADR-019 / §28.8): JWT values and cookie values are NEVER
 * printed — only cookie ATTRIBUTES (path/httpOnly/sameSite/maxAge) are
 * asserted. Secrets are read through config/env.js (the sanctioned
 * process.env reader) — this script reads no process.env itself.
 */
import process from 'node:process';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  ACCESS_TOKEN_TTL_MIN,
  REFRESH_TOKEN_TTL_DAYS,
  AVATAR_MAX_SIZE_BYTES,
} from '../utils/constants.js';

const BASE = 'http://localhost:4000';
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const RUN_SUFFIX = `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 8)}`;
const FIXTURE_EMAIL = `sp3.${RUN_SUFFIX}@example.com`;
const FIXTURE_PASSWORD = 'secret123';
const NOPROFILE_EMAIL = `sp3.noprofile.${RUN_SUFFIX}@example.com`;

let pass = 0;
let fail = 0;

function out(line = '') {
  process.stdout.write(`${line}\n`);
}

function jsonBody(data) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function request(method, path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { method, ...options });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body, setCookies: res.headers.getSetCookie() };
}

function verdict(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    out(`  PASS \u2713 ${name}`);
  } else {
    fail += 1;
    out(`  FAIL \u2717 ${name}${detail ? ` \u2014 ${detail}` : ''}`);
  }
}

function section(title) {
  out(`\u2500\u2500\u2500 ${title} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
}

async function httpCheck(id, name, method, path, opts, asserts) {
  out(`[${id}] ${method} ${path}`);
  const res = await request(method, path, opts);
  out(`    status : ${res.status}`);
  out(`    body   : ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
  const failures = [];
  for (const [label, ok] of asserts(res)) {
    if (!ok) failures.push(label);
  }
  verdict(name, failures.length === 0, failures.length ? `failed: ${failures.join(', ')}` : '');
}

function unitCheck(id, name, ok, detail = '') {
  out(`[${id}] UNIT ${name}`);
  verdict(name, ok, detail);
}

// Cookie jar — captures set-cookie names/values for authenticated
// requests. Values are only ever placed in the Cookie header; they
// are never printed (§28.8/ADR-019).
const jar = {};
function loadCookies(setCookies) {
  for (const sc of setCookies) {
    const [pair, ...attrParts] = sc.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    jar[name] = value;
    out(`    cookie   : ${name} (${attrParts.map((a) => a.trim()).join(', ')})`);
  }
}
function cookieHeader() {
  return Object.entries(jar)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}
function cookieAttrs(setCookies, name) {
  const sc = setCookies.find((s) => s.startsWith(`${name}=`)) ?? '';
  return Object.fromEntries(
    sc
      .split(';')
      .slice(1)
      .map((a) => a.trim().split('='))
      .filter(([k]) => k)
      .map(([k, v]) => [k.toLowerCase(), v ?? '']),
  );
}
function clearJar() {
  for (const k of Object.keys(jar)) delete jar[k];
}

async function authRequest(method, path, opts = {}) {
  return request(method, path, {
    ...opts,
    headers: { ...(opts.headers ?? {}), Cookie: cookieHeader() },
  });
}

/** Ensures FIXTURE_EMAIL exists and a session is established for it. */
async function establishSession(email = FIXTURE_EMAIL) {
  clearJar();
  let res = await request('POST', '/api/v1/auth/login', jsonBody({ email, password: FIXTURE_PASSWORD }));
  if (res.status === 401) {
    await request('POST', '/api/v1/auth/register', jsonBody({ email, password: FIXTURE_PASSWORD }));
    res = await request('POST', '/api/v1/auth/login', jsonBody({ email, password: FIXTURE_PASSWORD }));
  }
  loadCookies(res.setCookies);
  return res;
}

function hasDetail(res, field, message) {
  const details = res.body?.details ?? [];
  return details.some((d) => d.field === field && d.message === message);
}

/** Authenticated variant of httpCheck — establishes a session first. */
async function authCheck(id, name, method, path, opts, asserts) {
  await establishSession();
  const res = await authRequest(method, path, opts);
  out(`[${id}] ${method} ${path}`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const failures = [];
  for (const [label, ok] of asserts(res)) {
    if (!ok) failures.push(label);
  }
  verdict(name, failures.length === 0, failures.length ? `failed: ${failures.join(', ')}` : '');
}

function userDto(res) {
  return res.body?.data?.user ?? null;
}

const checks = [];
function addCheck(group, id, name, fn) {
  checks.push({ group, id, name, fn });
}

// ── UNIT — token TTL constants (§11.3) ─────────────────────────────
addCheck('unit', 2, 'token TTL constants present', () =>
  unitCheck(2, 'token TTL constants present', ACCESS_TOKEN_TTL_MIN === 15 && REFRESH_TOKEN_TTL_DAYS === 7));

// ── register ───────────────────────────────────────────────────────
addCheck('register', 10, 'register 201 no-cookie DTO', () =>
  httpCheck(10, 'register 201 no-cookie DTO', 'POST', '/api/v1/auth/register',
    jsonBody({ email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD }), (r) => {
      const user = userDto(r);
      const local = FIXTURE_EMAIL.split('@')[0];
      const [first, ...rest] = local.split('.');
      const expectedLast = rest.join('.') || first;
      return [
        ['status 201', r.status === 201],
        ['success true', r.body?.success === true],
        ['message Account created', r.body?.message === 'Account created'],
        ['no cookies set', r.setCookies.length === 0],
        ['derived firstName', user?.firstName === first],
        ['derived lastName', user?.lastName === expectedLast],
        ['fullName joins names', user?.fullName === `${first} ${expectedLast}`],
        ['avatar null', user?.avatar === null],
        ['position null', user?.position === null],
        ['no password key', !('password' in (user ?? {}))],
        ['no id key (only _id)', user && !('id' in user) && '_id' in user],
      ];
    }));

addCheck('register', 11, 'duplicate email 409', () =>
  httpCheck(11, 'duplicate email 409', 'POST', '/api/v1/auth/register',
    jsonBody({ email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD }), (r) => [
      ['status 409', r.status === 409],
      ['message dup copy', r.body?.message === 'An account with this email already exists'],
      ['no cookies set', r.setCookies.length === 0],
    ]));

addCheck('register', 12, 'email normalization folds case (dup 409)', () =>
  httpCheck(12, 'email normalization folds case (dup 409)', 'POST', '/api/v1/auth/register',
    jsonBody({ email: FIXTURE_EMAIL.toUpperCase(), password: FIXTURE_PASSWORD }), (r) => [
      ['status 409 (normalized duplicate)', r.status === 409],
      ['message dup copy', r.body?.message === 'An account with this email already exists'],
    ]));

addCheck('register', 13, 'invalid email 422 details', () =>
  httpCheck(13, 'invalid email 422 details', 'POST', '/api/v1/auth/register',
    jsonBody({ email: 'not-an-email', password: FIXTURE_PASSWORD }), (r) => [
      ['status 422', r.status === 422],
      ['message Check the highlighted fields', r.body?.message === 'Check the highlighted fields'],
      ['details email', hasDetail(r, 'email', 'Enter a valid email')],
    ]));

addCheck('register', 14, 'short password 422 details', () =>
  httpCheck(14, 'short password 422 details', 'POST', '/api/v1/auth/register',
    jsonBody({ email: `sp3.short.${RUN_SUFFIX}@example.com`, password: 'short' }), (r) => [
      ['status 422', r.status === 422],
      ['details password min 8', hasDetail(r, 'password', 'Password must be at least 8 characters')],
    ]));

addCheck('register', 15, 'firstName rejected 422', () =>
  httpCheck(15, 'firstName rejected 422', 'POST', '/api/v1/auth/register',
    jsonBody({ email: `sp3.name.${RUN_SUFFIX}@example.com`, password: FIXTURE_PASSWORD, firstName: 'Beza' }), (r) => [
      ['status 422', r.status === 422],
      ['details firstName', hasDetail(r, 'firstName', 'First name is not accepted at registration')],
    ]));

addCheck('register', 16, 'lastName rejected 422', () =>
  httpCheck(16, 'lastName rejected 422', 'POST', '/api/v1/auth/register',
    jsonBody({ email: `sp3.name.${RUN_SUFFIX}@example.com`, password: FIXTURE_PASSWORD, lastName: 'Ayalew' }), (r) => [
      ['status 422', r.status === 422],
      ['details lastName', hasDetail(r, 'lastName', 'Last name is not accepted at registration')],
    ]));

addCheck('register', 17, 'missing fields 422', () =>
  httpCheck(17, 'missing fields 422', 'POST', '/api/v1/auth/register',
    jsonBody({}), (r) => [
      ['status 422', r.status === 422],
      ['details email', hasDetail(r, 'email', 'Enter a valid email')],
      ['details password', hasDetail(r, 'password', 'Password must be at least 8 characters')],
    ]));

// ── login ──────────────────────────────────────────────────────────
addCheck('login', 19, 'fixture bootstrap (register or login)', async () => {
  await establishSession();
  out(`[19] fixture bootstrap ${FIXTURE_EMAIL}`);
  out(`    status : session ready (register-or-login)`);
  verdict('fixture bootstrap (register or login)', Object.keys(jar).length >= 2);
});

addCheck('login', 20, 'login 200 cookies + DTO', () =>
  httpCheck(20, 'login 200 cookies + DTO', 'POST', '/api/v1/auth/login',
    jsonBody({ email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD }), (r) => {
      const user = userDto(r);
      const access = cookieAttrs(r.setCookies, 'accessToken');
      const refresh = cookieAttrs(r.setCookies, 'refreshToken');
      return [
        ['status 200', r.status === 200],
        ['message Welcome back', r.body?.message === 'Welcome back'],
        ['user email match', user?.email === FIXTURE_EMAIL],
        ['access cookie set', r.setCookies.some((s) => s.startsWith('accessToken='))],
        ['refresh cookie set', r.setCookies.some((s) => s.startsWith('refreshToken='))],
        ['access cookie path /api/v1', access.path === '/api/v1'],
        ['access cookie httpOnly', 'httponly' in access],
        ['access cookie sameSite lax', access.samesite === 'Lax'],
        ['access cookie maxAge 15min', access['max-age'] === String(ACCESS_TOKEN_TTL_MIN * 60)],
        ['refresh cookie path /api/v1/auth', refresh.path === '/api/v1/auth'],
        ['refresh cookie maxAge 7days', refresh['max-age'] === String(REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60)],
      ];
    }));

addCheck('login', 21, 'wrong password 401 identical copy', () =>
  httpCheck(21, 'wrong password 401 identical copy', 'POST', '/api/v1/auth/login',
    jsonBody({ email: FIXTURE_EMAIL, password: 'wrongpass' }), (r) => [
      ['status 401', r.status === 401],
      ['message identical copy', r.body?.message === 'Incorrect email or password'],
      ['no cookies set', r.setCookies.length === 0],
    ]));

addCheck('login', 22, 'unknown email 401 identical copy', () =>
  httpCheck(22, 'unknown email 401 identical copy', 'POST', '/api/v1/auth/login',
    jsonBody({ email: 'nobody@example.com', password: FIXTURE_PASSWORD }), (r) => [
      ['status 401', r.status === 401],
      ['message identical copy', r.body?.message === 'Incorrect email or password'],
      ['no cookies set', r.setCookies.length === 0],
    ]));

addCheck('login', 23, 'malformed login 422', () =>
  httpCheck(23, 'malformed login 422', 'POST', '/api/v1/auth/login',
    jsonBody({ email: 'nope', password: '' }), (r) => [
      ['status 422', r.status === 422],
      ['details email', hasDetail(r, 'email', 'Enter a valid email')],
      ['details password', hasDetail(r, 'password', 'Password is required')],
    ]));

addCheck('login', 24, 'auth tier policy headers q=20 w=900', () =>
  httpCheck(24, 'auth tier policy headers q=20 w=900', 'POST', '/api/v1/auth/login',
    jsonBody({ email: 'nobody@example.com', password: 'wrongpass' }), (r) => {
      const policy = r.headers.get('ratelimit-policy') ?? '';
      const header = r.headers.get('ratelimit') ?? '';
      return [
        ['status 401', r.status === 401],
        ['RateLimit-Policy q=20', policy.includes('q=20')],
        ['RateLimit-Policy w=900 (15 min)', policy.includes('w=900')],
        ['RateLimit header present', header.length > 0],
      ];
    }));

// ── refresh ────────────────────────────────────────────────────────
addCheck('refresh', 30, 'refresh rotation 200', async () => {
  await establishSession();
  const res = await authRequest('POST', '/api/v1/auth/refresh');
  out(`[30] POST /api/v1/auth/refresh`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const refresh = cookieAttrs(res.setCookies, 'refreshToken');
  const user = userDto(res);
  verdict('refresh rotation 200', [
    ['status 200', res.status === 200],
    ['message Session refreshed', res.body?.message === 'Session refreshed'],
    ['rotated refresh cookie re-issued', res.setCookies.some((s) => s.startsWith('refreshToken='))],
    ['refresh cookie maxAge 7days', refresh['max-age'] === String(REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60)],
    ['user DTO present', user !== null && user.email === FIXTURE_EMAIL],
  ].every(([, ok]) => ok));
});

addCheck('refresh', 31, 'refresh no cookie 401 + clear', () =>
  httpCheck(31, 'refresh no cookie 401 + clear', 'POST', '/api/v1/auth/refresh', {}, (r) => [
    ['status 401', r.status === 401],
    ['message expired copy', r.body?.message === 'Session expired \u2014 sign in again'],
    ['cookies cleared', r.setCookies.length >= 2 && r.setCookies.every((s) => /Max-Age=0|Expires=Thu, 01 Jan 1970/.test(s))],
  ]));

addCheck('refresh', 32, 'forged expired refresh 401 + clear', () => {
  const expired = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c0d1', type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: -60 },
  );
  return httpCheck(32, 'forged expired refresh 401 + clear', 'POST', '/api/v1/auth/refresh',
    { headers: { Cookie: `refreshToken=${expired}` } }, (r) => [
      ['status 401', r.status === 401],
      ['message expired copy', r.body?.message === 'Session expired \u2014 sign in again'],
      ['cookies cleared', r.setCookies.some((s) => s.startsWith('refreshToken=') && /Max-Age=0|Expires=Thu, 01 Jan 1970/.test(s))],
    ]);
});

addCheck('refresh', 33, 'access token in refresh cookie 401', () => {
  const access = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c0d1', type: 'access' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: 3600 },
  );
  return httpCheck(33, 'access token in refresh cookie 401', 'POST', '/api/v1/auth/refresh',
    { headers: { Cookie: `refreshToken=${access}` } }, (r) => [
      ['status 401', r.status === 401],
      ['message expired copy', r.body?.message === 'Session expired \u2014 sign in again'],
    ]);
});

// ── profile ────────────────────────────────────────────────────────
addCheck('profile', 40, 'profile position update 200', async () => {
  await establishSession();
  const res = await authRequest('PATCH', '/api/v1/auth/profile', jsonBody({ position: 'Daily supervisor' }));
  out(`[40] PATCH /api/v1/auth/profile`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const user = userDto(res);
  verdict('profile position update 200', [
    ['status 200', res.status === 200],
    ['message Profile updated', res.body?.message === 'Profile updated'],
    ['position set', user?.position === 'Daily supervisor'],
  ].every(([, ok]) => ok));
});

addCheck('profile', 41, 'profile overlong position 422', () =>
  authCheck(41, 'profile overlong position 422', 'PATCH', '/api/v1/auth/profile',
    jsonBody({ position: 'x'.repeat(201) }), (r) => [
      ['status 422', r.status === 422],
      ['details position too long', hasDetail(r, 'position', 'Position is too long')],
    ]));

addCheck('profile', 42, 'profile empty body 422', () =>
  authCheck(42, 'profile empty body 422', 'PATCH', '/api/v1/auth/profile',
    jsonBody({}), (r) => [
      ['status 422', r.status === 422],
      ['details at-least-one', (r.body?.details ?? []).some((d) => d.message === 'Provide at least one field to update')],
    ]));

addCheck('profile', 43, 'profile rename stands 200', async () => {
  await establishSession();
  const res = await authRequest('PATCH', '/api/v1/auth/profile', jsonBody({ firstName: 'Meklit', lastName: 'Belete' }));
  out(`[43] PATCH /api/v1/auth/profile`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const user = userDto(res);
  verdict('profile rename stands 200', [
    ['status 200', res.status === 200],
    ['firstName stands', user?.firstName === 'Meklit'],
    ['lastName stands', user?.lastName === 'Belete'],
    ['fullName rejoined', user?.fullName === 'Meklit Belete'],
  ].every(([, ok]) => ok));
});

addCheck('profile', 44, 'overlong first name 422', () =>
  authCheck(44, 'overlong first name 422', 'PATCH', '/api/v1/auth/profile',
    jsonBody({ firstName: 'x'.repeat(101) }), (r) => [
      ['status 422', r.status === 422],
      ['details firstName too long', hasDetail(r, 'firstName', 'First name is too long')],
    ]));

addCheck('profile', 45, 'empty position 422', () =>
  authCheck(45, 'empty position 422', 'PATCH', '/api/v1/auth/profile',
    jsonBody({ position: '' }), (r) => [
      ['status 422', r.status === 422],
      ['details position empty', hasDetail(r, 'position', 'Position cannot be empty')],
    ]));

// ── avatar ─────────────────────────────────────────────────────────
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function avatarForm(buffer, type, filename) {
  const form = new FormData();
  form.append('avatar', new Blob([buffer], { type }), filename);
  return { body: form };
}

addCheck('avatar', 50, 'no-avatar 404 (fresh user)', async () => {
  await establishSession(NOPROFILE_EMAIL);
  const res = await authRequest('GET', '/api/v1/auth/avatar');
  out(`[50] GET /api/v1/auth/avatar`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  verdict('no-avatar 404 (fresh user)', [
    ['status 404', res.status === 404],
    ['message No avatar', res.body?.message === 'No avatar'],
  ].every(([, ok]) => ok));
});

addCheck('avatar', 51, 'avatar upload multipart 200', async () => {
  await establishSession();
  const res = await authRequest('PATCH', '/api/v1/auth/profile', avatarForm(PNG_1PX, 'image/png', 'avatar.png'));
  out(`[51] PATCH /api/v1/auth/profile (multipart avatar)`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const user = userDto(res);
  verdict('avatar upload multipart 200', [
    ['status 200', res.status === 200],
    ['avatar set to uploads/avatar path', typeof user?.avatar === 'string' && user.avatar.startsWith('uploads/avatar/') && user.avatar.endsWith('.png')],
  ].every(([, ok]) => ok));
});

addCheck('avatar', 52, 'avatar GET 200 content-type + cache', async () => {
  await establishSession();
  const res = await authRequest('GET', '/api/v1/auth/avatar');
  out(`[52] GET /api/v1/auth/avatar`);
  out(`    status : ${res.status}`);
  out(`    body   : ${res.status === 200 ? '(binary image stream)' : JSON.stringify(res.body)}`);
  verdict('avatar GET 200 content-type + cache', [
    ['status 200', res.status === 200],
    ['content-type image/png', (res.headers.get('content-type') ?? '').includes('image/png')],
    ['cache-control set', typeof res.headers.get('cache-control') === 'string' && res.headers.get('cache-control').length > 0],
  ].every(([, ok]) => ok));
});

addCheck('avatar', 53, 'wrong avatar mime 422', async () => {
  await establishSession();
  const res = await authRequest('PATCH', '/api/v1/auth/profile', avatarForm(Buffer.from('hello'), 'text/plain', 'x.txt'));
  out(`[53] PATCH /api/v1/auth/profile (multipart wrong mime)`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  verdict('wrong avatar mime 422', [
    ['status 422', res.status === 422],
    ['details avatar mime', (res.body?.details ?? []).some((d) => d.field === 'avatar' && d.message === 'Avatar must be a JPEG, PNG, or WebP image')],
  ].every(([, ok]) => ok));
});

addCheck('avatar', 54, 'oversized avatar 422', async () => {
  await establishSession();
  const res = await authRequest(
    'PATCH',
    '/api/v1/auth/profile',
    avatarForm(Buffer.alloc(AVATAR_MAX_SIZE_BYTES + 1), 'image/png', 'big.png'),
  );
  out(`[54] PATCH /api/v1/auth/profile (multipart oversized)`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  verdict('oversized avatar 422', [
    ['status 422', res.status === 422],
    ['details avatar size', (res.body?.details ?? []).some((d) => d.field === 'avatar' && d.message === 'File is too large')],
  ].every(([, ok]) => ok));
});

// ── misc ───────────────────────────────────────────────────────────
addCheck('misc', 60, 'google stub 404', () =>
  httpCheck(60, 'google stub 404', 'GET', '/api/v1/auth/google', {}, (r) => [
    ['status 404', r.status === 404],
    ['message Google stub', r.body?.message === 'Google sign-in is not available in this version'],
  ]));

addCheck('misc', 61, 'authenticated route without cookie 401', () =>
  httpCheck(61, 'authenticated route without cookie 401', 'GET', '/api/v1/auth/avatar', {}, (r) => [
    ['status 401', r.status === 401],
    ['message Sign in to continue', r.body?.message === 'Sign in to continue'],
  ]));

addCheck('misc', 62, 'forged expired access 401', () => {
  const expired = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c0d1', type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: -60 },
  );
  return httpCheck(62, 'forged expired access 401', 'GET', '/api/v1/auth/avatar',
    { headers: { Cookie: `accessToken=${expired}` } }, (r) => [
      ['status 401', r.status === 401],
      ['message Sign in to continue', r.body?.message === 'Sign in to continue'],
    ]);
});

addCheck('misc', 63, 'refresh token as access 401', () => {
  const refresh = jwt.sign(
    { sub: '64f1a2b3c4d5e6f7a8b9c0d1', type: 'refresh' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: 3600 },
  );
  return httpCheck(63, 'refresh token as access 401', 'GET', '/api/v1/auth/avatar',
    { headers: { Cookie: `accessToken=${refresh}` } }, (r) => [
      ['status 401', r.status === 401],
      ['message Sign in to continue', r.body?.message === 'Sign in to continue'],
    ]);
});

addCheck('misc', 64, 'unknown auth path 404 registry', () =>
  httpCheck(64, 'unknown auth path 404 registry', 'GET', '/api/v1/auth/nope', {}, (r) => [
    ['status 404', r.status === 404],
    ['message Route not found', r.body?.message === 'Route not found'],
  ]));

addCheck('misc', 65, 'logout without session idempotent 200', () => {
  clearJar();
  return httpCheck(65, 'logout without session idempotent 200', 'POST', '/api/v1/auth/logout', {}, (r) => [
    ['status 200', r.status === 200],
    ['message Signed out', r.body?.message === 'Signed out'],
  ]);
});

addCheck('misc', 66, 'logout clears both cookies', async () => {
  await establishSession();
  const res = await authRequest('POST', '/api/v1/auth/logout');
  out(`[66] POST /api/v1/auth/logout`);
  out(`    status : ${res.status}`);
  out(`    body   : ${JSON.stringify(res.body)}`);
  const access = cookieAttrs(res.setCookies, 'accessToken');
  const refresh = cookieAttrs(res.setCookies, 'refreshToken');
  out(`    access cookie attrs : ${JSON.stringify(access)}`);
  out(`    refresh cookie attrs: ${JSON.stringify(refresh)}`);
  const cleared = (attrs) =>
    attrs['max-age'] === '0' || /Thu, 01 Jan 1970/.test(attrs.expires ?? '');
  verdict(
    'logout clears both cookies',
    res.status === 200 && cleared(access) && cleared(refresh),
    `access ${JSON.stringify(access)} refresh ${JSON.stringify(refresh)}`,
  );
});

// ── ratelimit (isolated, LAST — exhausts the auth tier) ────────────
// Deterministic only on a fresh window (backend restart before this
// run): hits 1–20 pass (401), the 21st is the first 429.
addCheck('ratelimit', 70, 'auth tier 429 on the 21st rapid hit', async () => {
  out(`[70] POST /api/v1/auth/login x21 (rapid, bad credentials)`);
  let first429At = null;
  for (let i = 1; i <= 21; i += 1) {
    const res = await request('POST', '/api/v1/auth/login', jsonBody({ email: FIXTURE_EMAIL, password: 'wrongpass' }));
    out(`      #${String(i).padStart(2)} status : ${res.status}`);
    out(`      body   : ${JSON.stringify(res.body)}`);
    if (res.status === 429 && first429At === null) first429At = i;
  }
  verdict(
    'auth tier 429 on the 21st rapid hit',
    first429At === 21,
    first429At === null ? 'no 429 within 21 hits' : `first 429 at hit #${first429At} (run this group isolated after a restart)`,
  );
});

// Runner (§63.10). The auth tier is 20 requests/15 min per IP
// (§27.3), so a single process can never hold the full matrix; the
// default run executes the bootstrap group (unit + register, 8 HTTP
// requests — well under the budget) and then prints the per-group
// restart protocol for the remaining groups. Each group stays under
// the budget and MUST be run after a backend restart; `ratelimit`
// exhausts the tier and runs last, in isolation.
const DEFAULT_GROUPS = ['unit', 'register'];
const GROUPS_IN_ORDER = ['unit', 'register', 'login', 'refresh', 'profile', 'avatar', 'misc', 'ratelimit'];
const groupsToRun = ONLY ? [ONLY] : DEFAULT_GROUPS;

if (ONLY) {
  out(`Running only group: ${ONLY}`);
} else {
  out(`Bootstrap run (groups: ${DEFAULT_GROUPS.join(', ')}) — the auth tier (20/15 min) cannot hold the full matrix.`);
  out(`After this run, restart the backend and run each remaining group in turn:`);
  out(`  node scripts/test-03-identity.mjs --only=login`);
  out(`  node scripts/test-03-identity.mjs --only=refresh`);
  out(`  node scripts/test-03-identity.mjs --only=profile`);
  out(`  node scripts/test-03-identity.mjs --only=avatar`);
  out(`  node scripts/test-03-identity.mjs --only=misc`);
  out(`  node scripts/test-03-identity.mjs --only=ratelimit   (last — exhausts the tier)`);
}

const selected = checks.filter((c) => groupsToRun.includes(c.group));
for (const check of selected) {
  try {
    await check.fn();
  } catch (err) {
    out(`  FAIL \u2717 ${check.name} \u2014 threw: ${err.message}`);
    fail += 1;
  }
}

out(`\nPASS=${pass} FAIL=${fail}`);
if (fail > 0) process.exit(1);