/**
 * Sub-phase 1 — Foundation verification suite (§63.10).
 *
 * Terminal-visible contract: every check prints the request (method +
 * path) and the response status + full JSON body, then a PASS/FAIL
 * verdict. The suite ends with PASS=N FAIL=M and exits non-zero on any
 * failure. Output goes through process.stdout.write (no console.log
 * literal — §9.5/§63.4 grep-gate clean). Zero dependencies (Node 24 +
 * built-in fetch).
 *
 * Run: from backend/, with the dev server on :4000
 *   node scripts/test-01-foundation.mjs
 *   node scripts/test-01-foundation.mjs --only=health
 *
 * Note: restart the backend before each suite run — the in-memory
 * rate-limit store resets on restart (15-min global window, §27.3).
 *
 * Scope: health contract, envelope, not-found, JSON body handling,
 * CORS, compression, helmet, global rate-limit tier (§26–§27).
 */
import process from 'node:process';

const BASE = process.env.TEST_BASE ?? 'http://localhost:4000';
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

let pass = 0;
let fail = 0;

function out(line = '') {
  process.stdout.write(`${line}\n`);
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
  return { status: res.status, headers: res.headers, body };
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

// Registry-driven checks so `--only=<group>` runs a single group's
// checks (§63.10). Groups mirror endpoint surfaces; skipped checks are
// not counted in the summary.
const checks = [];
function addCheck(group, id, name, fn) {
  checks.push({ group, id, name, fn });
}

addCheck('health', 1, 'health status 200', () =>
  httpCheck(1, 'health status 200', 'GET', '/api/v1/health', {}, (r) => [
    ['status 200', r.status === 200],
    ['success true', r.body.success === true],
    ['message OK', r.body.message === 'OK'],
    ['data.status up', r.body.data?.status === 'up'],
    ['uptime number>0', typeof r.body.data?.uptime === 'number' && r.body.data.uptime > 0],
  ]));

addCheck('envelope', 2, 'unknown route 404 envelope', () =>
  httpCheck(2, 'unknown route 404 envelope', 'GET', '/api/v1/nope', {}, (r) => [
    ['status 404', r.status === 404],
    ['success false', r.body.success === false],
    ['message Route not found', r.body.message === 'Route not found'],
    ['data null', r.body.data === null],
  ]));

addCheck('envelope', 3, 'root path 404', () =>
  httpCheck(3, 'root path 404', 'GET', '/', {}, (r) => [['status 404', r.status === 404]]));

addCheck('envelope', 4, 'registry root 404', () =>
  httpCheck(4, 'registry root 404', 'GET', '/api/v1', {}, (r) => [['status 404', r.status === 404]]));

addCheck('envelope', 5, 'wrong method 404', () =>
  httpCheck(5, 'wrong method 404', 'POST', '/api/v1/health', {}, (r) => [['status 404', r.status === 404]]));

addCheck('json', 6, 'json body parsed, route absent -> 404', () =>
  httpCheck(6, 'json body parsed, route absent -> 404', 'POST', '/api/v1/echo', {
    headers: { 'Content-Type': 'application/json' },
    body: '{"a":1}',
  }, (r) => [['status 404', r.status === 404]]));

addCheck('json', 7, 'malformed json -> 400', () =>
  httpCheck(7, 'malformed json -> 400', 'POST', '/api/v1/health', {
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  }, (r) => [
    ['status 400', r.status === 400],
    ['success false', r.body.success === false],
    ['message Malformed request body', r.body.message === 'Malformed request body.'],
    ['data null', r.body.data === null],
  ]));

addCheck('middleware', 8, 'cors preflight 204', () =>
  httpCheck(8, 'cors preflight 204', 'OPTIONS', '/api/v1/health', {
    headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET' },
  }, (r) => [
    ['status 204', r.status === 204],
    ['allow-origin header', (r.headers.get('access-control-allow-origin') || '').toLowerCase() === 'http://localhost:3000'],
  ]));

addCheck('middleware', 9, 'compression wired (Vary header)', () =>
  httpCheck(9, 'compression wired (Vary header)', 'GET', '/api/v1/health', {
    headers: { 'Accept-Encoding': 'gzip' },
  }, (r) => [['vary accept-encoding', (r.headers.get('vary') || '').toLowerCase().includes('accept-encoding')]]));

addCheck('middleware', 10, 'helmet hardening header', () =>
  httpCheck(10, 'helmet hardening header', 'GET', '/api/v1/health', {}, (r) => [['x-content-type-options nosniff', (r.headers.get('x-content-type-options') || '').toLowerCase() === 'nosniff']]));

addCheck('ratelimit', 11, 'global tier: remaining budget allowed then 429', async () => {
  out('[11] GET /api/v1/rate-test  (probe + \u00d7105 concurrent)');
  const probe = await request('GET', '/api/v1/rate-test');
  const rm = probe.headers.get('ratelimit') || '';
  const rmatch = rm.match(/\br=(\d+)/);
  const remaining = rmatch ? Number(rmatch[1]) : -1;
  out(`    probe status : ${probe.status} | ratelimit header r=${rmatch ? rmatch[1] : 'n/a'}`);
  const codes = await Promise.all(
    Array.from({ length: 105 }, () => request('GET', '/api/v1/rate-test').then((r) => r.status)),
  );
  const c404 = codes.filter((c) => c === 404).length;
  const c429 = codes.filter((c) => c === 429).length;
  const expected404 = remaining;
  const expected429 = 105 - remaining;
  out(`    status : 404 \u00d7${c404}, 429 \u00d7${c429}  (expected 404 \u00d7${expected404}, 429 \u00d7${expected429})`);
  verdict('global tier: remaining budget allowed then 429', remaining >= 0 && c404 === expected404 && c429 === expected429, `got 404=${c404} 429=${c429} remaining=${remaining}`);
  const healthAfter = await request('GET', '/api/v1/health');
  out(`    health while exhausted : ${healthAfter.status}`);
  verdict('health exempt from rate limit', healthAfter.status === 200, `got ${healthAfter.status}`);
});

async function main() {
  out('');
  out(`=== Stage 4 \u00b7 Sub-phase 1 \u2014 Foundation (health, envelope, middleware) ===`);
  out(`base: ${BASE}${ONLY ? ` | --only=${ONLY}` : ''} | started ${new Date().toISOString()}`);

  // Readiness guard: the suite requires the backend on :4000.
  try {
    const r = await request('GET', '/api/v1/health');
    if (r.status !== 200) {
      out(`\nFAIL  backend not ready on ${BASE} (health returned ${r.status}).`);
      out('Start it: cd backend && npm run dev   (then rerun this suite)');
      process.exit(1);
    }
  } catch {
    out(`\nFAIL  cannot reach ${BASE}. Start the backend: cd backend && npm run dev`);
    process.exit(1);
  }

  const groups = ['health', 'envelope', 'json', 'middleware', 'ratelimit'];
  const active = ONLY
    ? checks.filter((c) => c.group === ONLY || c.id === Number(ONLY))
    : checks;
  const activeGroups = [...new Set(active.map((c) => c.group))];

  for (const group of activeGroups) {
    const groupChecks = active.filter((c) => c.group === group);
    section(groupChecks[0].id === 11 ? 'Global rate-limit tier (\u00a727.3)' : group.toUpperCase());
    for (const c of groupChecks) {
      try {
        await c.fn();
      } catch (err) {
        fail += 1;
        out(`  FAIL \u2717 ${c.name} \u2014 threw ${err.message}`);
      }
    }
  }

  out('');
  out('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  out(`SUMMARY  PASS=${pass}  FAIL=${fail}`);
  out(fail === 0 ? 'RESULT   ALL GREEN \u2014 sub-phase 1 foundation verified' : 'RESULT   FAILURES PRESENT \u2014 see above');
  process.exitCode = fail === 0 ? 0 : 1;
}

main();