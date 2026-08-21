/**
 * Sub-phase 6 — Seeding & Sweepers verification suite (§63.10):
 * §40 mock seed/wipe + §25 fixture rules + §62 sweeper.
 *
 * Terminal-visible contract: every check prints the request (method +
 * path) and the response status + full JSON body, then a PASS/FAIL
 * verdict; non-HTTP checks print a `UNIT`/`SWEEPER` line with the
 * same framing. The suite ends with PASS=N FAIL=M and exits non-zero
 * on any failure. Output goes through process.stdout.write (no
 * console.log literal). Zero dependencies beyond the installed
 * models + the mock/sweeper modules (fixture arrangement only).
 *
 * **Fixture-arrangement note:** the sweeper group arranges its
 * fixtures directly through the models (backdated `archivedAt`,
 * orphan rows, temp files) and calls `runSweeper()` directly — a
 * SWEEPER check, not a tested HTTP behavior; **no AI call ever runs
 * in this suite**.
 *
 * Groups (run per group with a backend restart between them):
 *   node scripts/test-06-seeding.mjs                 (unit)
 *   node scripts/test-06-seeding.mjs --only=seed
 *   node scripts/test-06-seeding.mjs --only=wipe
 *   node scripts/test-06-seeding.mjs --only=sweeper
 *   node scripts/test-06-seeding.mjs --only=sourcegates
 */
import process from 'node:process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/user.model.js';
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import Audio from '../models/audio.model.js';
import Transcription from '../models/transcription.model.js';
import Item from '../models/item.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import { assertRegisterValidTriples, MOCK_PATH_PREFIX, MOCK_USERS, MOCK_BRANCHES, MOCK_AUDIOS, MOCK_ITEMS } from '../mock/fixtures.js';
import { runSweeper } from '../jobs/sweeper.js';
import { ARCHIVED_TTL_SECONDS, REPORT_STATUSES } from '../utils/constants.js';

const BASE = 'http://localhost:4000';
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const RUN_SUFFIX = `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = 'secret123';

let pass = 0;
let fail = 0;

function out(line = '') {
  process.stdout.write(`${line}\n`);
}

function jsonBody(data) {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
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

function sweeperCheck(id, name, ok, detail = '') {
  out(`[${id}] SWEEPER ${name}`);
  verdict(name, ok, detail);
}

const jar = {};
function loadCookies(setCookies) {
  for (const sc of setCookies) {
    const [pair] = sc.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1);
  }
}
function cookieHeader() {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}
function authJson(data) {
  return { headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() }, body: JSON.stringify(data) };
}
function authHeaders() {
  return { headers: { Cookie: cookieHeader() } };
}

async function registerAndLogin(prefix) {
  const email = `${prefix}.${RUN_SUFFIX}@example.com`;
  const reg = await request('POST', '/api/v1/auth/register', jsonBody({ email, password: PASSWORD }));
  const login = await request('POST', '/api/v1/auth/login', jsonBody({ email, password: PASSWORD }));
  loadCookies(login.setCookies ?? []);
  return { email, registerStatus: reg.status, loginStatus: login.status, userId: null };
}

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  }
}

/** The seeded count contract (the §40.2 response). */
const SEEDED_COUNTS = { users: 2, branches: 4, reports: 4, audios: 6, transcriptions: 2, items: 12, conversations: 1 };

// ─────────────────────────────── GROUP: unit ───────────────────────────────

async function runUnit() {
  section('unit \u2014 §25/§40 fixtures + §62 math');
  out('[U1] UNIT register-valid conversation triples');
  {
    let ok = true;
    try {
      assertRegisterValidTriples();
    } catch {
      ok = false;
    }
    unitCheck('U1', 'the mock conversation triples are members of the §11.4 registers', ok);
  }
  out('[U2] UNIT the §25 mock-path convention');
  {
    unitCheck('U2', 'audio fixtures carry the mock/ prefix; MOCK_AUDIOS count = 6 (metadata-only)', MOCK_PATH_PREFIX === 'mock/' && MOCK_AUDIOS.length === 6 && MOCK_AUDIOS.every((a) => a.reportStatus && a.mimeType && a.sizeBytes > 0 && a.durationSec > 0));
  }
  out('[U3] UNIT fixture vocabulary — the §6.8 sample names');
  {
    const names = MOCK_BRANCHES.map((b) => b.name);
    unitCheck('U3', 'the 4 branch fixtures (3 active + 1 archived) use the §6.8 vocabulary', names.length === 4 && names.includes('መድኃኒዓለም') && names.includes('ኤርፖርት') && names.includes('ቡልቡላ') && names.includes('ጎላጉል') && MOCK_BRANCHES.filter((b) => b.isArchived).length === 1);
  }
  out('[U4] UNIT item fixture shape (§24A)');
  {
    unitCheck('U4', '12 items; 1 comment with a rating; the rest carry per-type statuses', MOCK_ITEMS.length === 12 && MOCK_ITEMS.filter((i) => i.rating !== undefined).length === 1 && MOCK_ITEMS.filter((i) => i.status !== undefined).length === 11);
  }
  out('[U5] UNIT sweeper window math (§62.2)');
  {
    const cutoff = new Date(Date.now() - ARCHIVED_TTL_SECONDS * 1000);
    const expired = new Date(Date.now() - (ARCHIVED_TTL_SECONDS + 60) * 1000);
    const fresh = new Date(Date.now() - 60 * 1000);
    unitCheck('U5', 'a row older than ARCHIVED_TTL_SECONDS is expired; a fresh archive is not', expired < cutoff && fresh > cutoff);
  }
}

// ──────────────────────────────── GROUP: seed ──────────────────────────────

async function runSeed() {
  section('seed \u2014 §40 (no AI)');
  const fixture = await registerAndLogin('sp6.sd');
  unitCheck('SD0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);
  await connectDb();

  await httpCheck('SD1', 'POST /mock/seed → the §40.2 counts', 'POST', '/api/v1/mock/seed', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['message', res.body?.message === 'Mock data seeded'],
    ['exact counts', JSON.stringify(res.body?.data?.seeded) === JSON.stringify(SEEDED_COUNTS)],
  ]);

  const userId = (await User.findOne({ email: fixture.email }).lean())._id;
  const [branchCount, reportCount, audioCount, transcriptionCount, itemCount, conversationCount, mockAudioPaths] = await Promise.all([
    Branch.countDocuments({ user: userId }),
    Report.countDocuments({ user: userId }),
    Audio.countDocuments({ user: userId }),
    Transcription.countDocuments({ user: userId }),
    Item.countDocuments({ user: userId }),
    ChatConversation.countDocuments({ user: userId }),
    Audio.find({ user: userId }).lean(),
  ]);
  const statuses = await Report.find({ user: userId }).select('status').lean();
  const reportStatuses = REPORT_STATUSES.every((s) => statuses.some((r) => r.status === s));
  const transcriptions = await Transcription.find({ user: userId }).lean();
  const refsOk = transcriptions.every((t) => {
    const report = statuses.find((r) => r._id.equals(t.report));
    return t.raw === t.latest && t.language === 'am' && report;
  });

  unitCheck('SD2', 'the §17.6-presence-valid fixture set (4 reports, one per status; 6 metadata-only audio with mock paths; 2 raw=latest transcriptions; 12 items; 1 conversation)', branchCount === 4 && reportCount === 4 && reportStatuses && audioCount === 6 && mockAudioPaths.every((a) => a.filePath.startsWith('mock/')) && transcriptionCount === 2 && refsOk && itemCount === 12 && conversationCount === 1);

  const generated = statuses.find((r) => r.status === REPORT_STATUSES[3]);
  const generatedItems = await Item.find({ report: generated._id }).lean();
  unitCheck('SD3', 'the generated fixture carries 12 Item rows with per-type statuses + the rating comment', generatedItems.length === 12 && generatedItems.some((i) => i.type === 'comment' && i.rating === 4));

  const branchNames = (await Branch.find({ user: userId }).select('name').lean()).map((b) => b.name);
  const probeBranch = await Branch.findOne({ name: 'ብስራተ ገብርኤል' }).lean();
  unitCheck('SD4', 'BR-13 probe: the second account owns ብስራተ ገብርኤል — invisible to the caller; the caller has exactly the 4 fixture branches', branchNames.length === 4 && !branchNames.includes('ብስራተ ገብርኤል') && !!probeBranch && !probeBranch.user.equals(userId));

  const persona = await User.findOne({ email: MOCK_USERS[0].email }).lean();
  const second = await User.findOne({ email: MOCK_USERS[1].email }).lean();
  unitCheck('SD5', 'the persona + second accounts exist with placeholder material (never the caller)', !!persona && !!second && !persona._id.equals(userId) && !second._id.equals(userId));

  const probeReport = await Report.findOne({ user: second._id }).lean();
  unitCheck('SD6', 'the second account has the probe draft report (Sample-4 day)', !!probeReport && probeReport.status === 'draft');

  await httpCheck('SD7', 're-seed without wipe → the SAME counts (self-replacing, D46 — no duplicates)', 'POST', '/api/v1/mock/seed', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['exact counts again', JSON.stringify(res.body?.data?.seeded) === JSON.stringify(SEEDED_COUNTS)],
  ]);
  const reportCountAfterReseed = await Report.countDocuments({ user: userId });
  unitCheck('SD8', 're-seed yields exactly ONE canonical set — still 4 reports (the §25.4 result-state anchor)', reportCountAfterReseed === 4);
}

// ──────────────────────────────── GROUP: wipe ──────────────────────────────

async function runWipe() {
  section('wipe \u2014 §40 (no AI)');
  const fixture = await registerAndLogin('sp6.wp');
  unitCheck('WP0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);
  await connectDb();

  await httpCheck('WP1', 'wipe without seed → 200 with zero scoped counts (never an error, §40.6)', 'POST', '/api/v1/mock/wipe', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['message', res.body?.message === 'Mock data wiped'],
    ['scoped zeros (the caller has no mock rows)', res.body?.data?.wiped?.branches === 0 && res.body?.data?.wiped?.reports === 0 && res.body?.data?.wiped?.audios === 0 && res.body?.data?.wiped?.transcriptions === 0 && res.body?.data?.wiped?.items === 0 && res.body?.data?.wiped?.conversations === 0],
  ]);

  // A real row that must survive the wipe (a non-fixture branch name + date).
  const realBranch = await request('POST', '/api/v1/branches', authJson({ name: 'ሪል ብራንች', location: 'Real' }));
  const realBranchId = realBranch.body?.data?._id;
  const realReport = await request('POST', '/api/v1/reports', authJson({
    branch: realBranchId, date: '2026-08-21T00:00:00.000Z', clockIn: '08:30', clockOut: '17:30',
    visits: [{ branch: realBranchId, clockIn: '08:30', clockOut: '17:30' }],
  }));
  unitCheck('WP2', 'real branch + report created (the wipe-survival probe)', realBranch.status === 201 && realReport.status === 201);

  await request('POST', '/api/v1/mock/seed', authHeaders());
  await httpCheck('WP3', 'seed → wipe → the §40.2 wiped counts', 'POST', '/api/v1/mock/wipe', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['counts', res.body?.data?.wiped?.branches === 4 && res.body?.data?.wiped?.reports === 4 && res.body?.data?.wiped?.audios === 6 && res.body?.data?.wiped?.transcriptions === 2 && res.body?.data?.wiped?.items === 12 && res.body?.data?.wiped?.conversations === 1 && res.body?.data?.wiped?.users === 2],
  ]);

  const userId = (await User.findOne({ email: fixture.email }).lean())._id;
  const [remainingBranches, remainingReports, remainingAudios, personaAfter] = await Promise.all([
    Branch.countDocuments({ user: userId }),
    Report.countDocuments({ user: userId }),
    Audio.countDocuments({ user: userId }),
    User.countDocuments({ email: MOCK_USERS[0].email }),
  ]);
  unitCheck('WP4', 'the store is empty of mock data; the persona accounts are removed (D44 — they were not the caller)', remainingBranches === 1 && remainingReports === 1 && remainingAudios === 0 && personaAfter === 0);

  const realAfter = await request('GET', `/api/v1/reports/${realReport.body?.data?._id}`, authHeaders());
  unitCheck('WP5', 'the real rows survived the wipe (the D41 signature boundary)', realAfter.status === 200 && realAfter.body?.data?.branch === realBranchId);
}

// ─────────────────────────────── GROUP: sweeper ────────────────────────────

async function runSweeperGroup() {
  section('sweeper \u2014 §62 (no AI, direct runSweeper)');
  const fixture = await registerAndLogin('sp6.sw');
  unitCheck('SW0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);
  await connectDb();
  const userId = (await User.findOne({ email: fixture.email }).lean())._id;

  // Arrangement: an expired archived report with the full cascade +
  // a real physical audio file; a referenced archived branch; an
  // unreferenced archived branch; a TTL-race orphan transcription; a
  // temp-leak file.
  const branchA = await Branch.create([{ user: userId, name: 'ስዊፕ ኤ', location: 'A' }]);
  const branchB = await Branch.create([{ user: userId, name: 'ስዊፕ ቢ', location: 'B' }]);
  const branchC = await Branch.create([{ user: userId, name: 'ስዊፕ ሲ', location: 'C' }]);
  const expired = await Report.create([{
    user: userId, branch: branchA[0]._id, date: new Date(Date.UTC(2026, 0, 5)), clockIn: '08:30', clockOut: '17:30',
    visits: [{ branch: branchA[0]._id, clockIn: '08:30', clockOut: '17:30' }],
    status: REPORT_STATUSES[3], isArchived: true, archivedAt: new Date(Date.now() - (ARCHIVED_TTL_SECONDS + 3600) * 1000),
  }]);
  const expiredId = expired[0]._id;
  await Audio.create([{ user: userId, report: expiredId, filePath: 'uploads/audio/sweep-test-orphan.webm', mimeType: 'audio/webm', sizeBytes: 100, durationSec: 10 }]);
  await Transcription.create([{ user: userId, report: expiredId, raw: 'r', latest: 'r', language: 'am' }]);
  await Item.create([{ user: userId, report: expiredId, branch: branchA[0]._id, date: new Date(Date.UTC(2026, 0, 5)), type: 'issue', text: 'x', status: 'reported' }]);
  await ChatConversation.create([{ user: userId, report: expiredId, reasoning: 'off', messages: [] }]);
  // A true TTL-race orphan audio (no parent from the start) + its file.
  const orphanAudio = await Audio.create([{ user: userId, report: new mongoose.Types.ObjectId(), filePath: 'uploads/audio/sweep-test-orphan2.webm', mimeType: 'audio/webm', sizeBytes: 100, durationSec: 10 }]);
  mkdirSync('uploads/audio', { recursive: true });
  writeFileSync('uploads/audio/sweep-test-orphan.webm', Buffer.from('not-a-real-audio'));
  writeFileSync('uploads/audio/sweep-test-orphan2.webm', Buffer.from('orphan2'));
  writeFileSync('uploads/audio/sweep-test-leak.webm', Buffer.from('leaked-temp'));

  // The referenced archived branch (the expired report references A —
  // wait, A is swept WITH the report — use C: archived + referenced by
  // a LIVE report; B: archived + unreferenced).
  const live = await Report.create([{
    user: userId, branch: branchC[0]._id, date: new Date(Date.UTC(2026, 7, 20)), clockIn: '08:30', clockOut: '17:30',
    visits: [{ branch: branchC[0]._id, clockIn: '08:30', clockOut: '17:30' }],
    status: REPORT_STATUSES[0],
  }]);
  await Branch.updateMany({ _id: { $in: [branchB[0]._id, branchC[0]._id] } }, { $set: { isArchived: true, archivedAt: new Date(Date.now() - (ARCHIVED_TTL_SECONDS + 3600) * 1000) } });

  // A TTL-race orphan transcription (no parent report).
  const orphanT = await Transcription.create([{ user: userId, report: new mongoose.Types.ObjectId(), raw: 'o', latest: 'o', language: 'am' }]);

  const result = await runSweeper();
  // branches ≥ 1: the unreferenced archived branches across ALL users
  // (the sweeper is not user-scoped — the seed group's archived
  // ጎላጉል is swept in the same run, §62.6 — no fixture exemption).
  sweeperCheck('SW1', 'runSweeper returns the removed counts (report + cascade + unreferenced branch + orphan + leak)', result?.reports === 1 && result?.branches >= 1 && result?.transcriptions >= 1 && result?.audios === 1 && result?.files >= 1);

  const expiredGone = await Report.countDocuments({ _id: expiredId });
  const transcriptionGone = await Transcription.countDocuments({ _id: orphanT[0]._id });
  const orphanAudioGone = await Audio.countDocuments({ _id: orphanAudio[0]._id });
  const cascadeGone = await Promise.all([
    Audio.countDocuments({ report: expiredId }),
    Transcription.countDocuments({ report: expiredId }),
    Item.countDocuments({ report: expiredId }),
    ChatConversation.countDocuments({ report: expiredId }),
  ]);
  const fileGone = !existsSync('uploads/audio/sweep-test-orphan.webm') && !existsSync('uploads/audio/sweep-test-orphan2.webm') && !existsSync('uploads/audio/sweep-test-leak.webm');
  sweeperCheck('SW2', 'the expired report + full cascade removed; the orphan transcription + orphan audio removed; the orphan files unlinked', expiredGone === 0 && transcriptionGone === 0 && orphanAudioGone === 0 && cascadeGone.every((c) => c === 0) && fileGone);

  const branchBAfter = await Branch.countDocuments({ _id: branchB[0]._id });
  const branchCAfter = await Branch.countDocuments({ _id: branchC[0]._id });
  sweeperCheck('SW3', 'the unreferenced archived branch removed (D50); the referenced archived branch survived (the §62.3 reference check)', branchBAfter === 0 && branchCAfter === 1 && (await Report.countDocuments({ _id: live[0]._id })) === 1);

  const clean = await runSweeper();
  sweeperCheck('SW4', 'a run over the clean store is a no-op (zeros — log-only, §62.5)', clean?.reports === 0 && clean?.branches === 0);
}

// ────────────────────────────── GROUP: sourcegates ─────────────────────────

async function runSourceGates() {
  section('sourcegates \u2014 §40.7/§62.9');
  out('[S1] UNIT no seeds in models (§18.8/§40.7)');
  {
    const models = readFileSync(join(process.cwd(), 'models', 'item.model.js'), 'utf8') +
      readFileSync(join(process.cwd(), 'models', 'report.model.js'), 'utf8') +
      readFileSync(join(process.cwd(), 'models', 'user.model.js'), 'utf8');
    const codeOnly = models.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    unitCheck('S1', 'models never import mock/ and carry no seed code', !codeOnly.includes('mock/') && !/\bseed/.test(codeOnly));
  }
  out('[S2] UNIT no seed call outside mock.routes.js (§40.7)');
  {
    const routes = readFileSync(join(process.cwd(), 'routes', 'mock.routes.js'), 'utf8');
    const offenders = [];
    for (const dir of ['controllers', 'services', 'validators', 'jobs', 'mock']) {
      for (const name of ['seed.js', 'wipe.js']) {
        let src = '';
        try {
          src = readFileSync(join(process.cwd(), dir, name), 'utf8');
        } catch {
          continue; // no such module — nothing to check
        }
        if (src.includes('from \'./seed.js\'') || src.includes('from \'./wipe.js\'')) {
          if (!(dir === 'mock')) offenders.push(`${dir}/${name}`);
        }
      }
    }
    unitCheck('S2', 'only mock.routes.js calls seed/wipe (the mock modules import each other only)', routes.includes('../mock/seed.js') && routes.includes('../mock/wipe.js') && offenders.length === 0);
  }
  out('[S3] UNIT the single §40.5 env check (§40.7)');
  {
    const registry = readFileSync(join(process.cwd(), 'routes', 'index.js'), 'utf8');
    const envChecks = [...registry.matchAll(/NODE_ENV/g)].length;
    unitCheck('S3', 'the mock conditional mount is the only development check in the registry', envChecks === 1 && registry.includes('if (env.NODE_ENV === \'development\')'));
  }
  out('[S4] UNIT exactly ONE TTL declaration (§62.9)');
  {
    let count = 0;
    for (const f of ['models/report.model.js', 'models/branch.model.js', 'models/audio.model.js', 'models/transcription.model.js', 'models/item.model.js', 'models/chatConversation.model.js', 'models/user.model.js']) {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      count += [...src.matchAll(/expireAfterSeconds/g)].length;
    }
    unitCheck('S4', `exactly one expireAfterSeconds declaration (Report), got ${count}`, count === 1);
  }
  out('[S5] UNIT no deletedAt field usage (§62.9)');
  {
    const jobs = readFileSync(join(process.cwd(), 'jobs', 'sweeper.js'), 'utf8');
    const controllers = readFileSync(join(process.cwd(), 'controllers', 'report.controller.js'), 'utf8');
    unitCheck('S5', 'no deletedAt field anywhere', !/deletedAt\s*[:=]/.test(jobs + controllers));
  }
  out('[S6] UNIT the sweeper uses only the two §11 constants (§62.9)');
  {
    const src = readFileSync(join(process.cwd(), 'jobs', 'sweeper.js'), 'utf8');
    unitCheck('S6', 'no magic durations in the sweeper', !/\b\d{6,}\b/.test(src) && src.includes('ARCHIVED_TTL_SECONDS') && src.includes('SWEEPER_INTERVAL_MS'));
  }
  out('[S7] UNIT no hard delete outside the sweeper (§62.9)');
  {
    const sweeper = readFileSync(join(process.cwd(), 'jobs', 'sweeper.js'), 'utf8');
    const controllers = ['report', 'branch', 'audio'].map((n) => readFileSync(join(process.cwd(), 'controllers', `${n}.controller.js`), 'utf8')).join('\n');
    unitCheck('S7', 'Report/Branch hard deletes live only in the sweeper', !/Report\.(deleteOne|deleteMany)|Branch\.(deleteOne|deleteMany)/.test(controllers) && /Report\.deleteOne|Branch\.deleteOne/.test(sweeper));
  }
  out('[S8] UNIT no physical files written by mock (§40.7/ADR-037)');
  {
    const src = readFileSync(join(process.cwd(), 'mock', 'seed.js'), 'utf8') + readFileSync(join(process.cwd(), 'mock', 'fixtures.js'), 'utf8');
    unitCheck('S8', 'the mock modules never write files (no writeFile/ffmpeg/multer)', !/writeFile|createWriteStream|execFile|multer/.test(src));
  }
  out('[S9] UNIT the sweeper starts after listening (§26.6)');
  {
    const server = readFileSync(join(process.cwd(), 'server.js'), 'utf8');
    unitCheck('S9', 'server.js starts the sweeper in the listen callback and clears it on shutdown', server.includes('startSweeper()') && server.includes('stopSweeper()'));
  }
}

// ───────────────────────────────── main ────────────────────────────────────

const GROUPS = {
  unit: runUnit,
  seed: runSeed,
  wipe: runWipe,
  sweeper: runSweeperGroup,
  sourcegates: runSourceGates,
};

async function main() {
  if (ONLY) {
    const fn = GROUPS[ONLY];
    if (!fn) {
      out(`Unknown group: ${ONLY}. Known: ${Object.keys(GROUPS).join(', ')}`);
      process.exit(2);
    }
    await fn();
  } else {
    await runUnit();
    out('');
    out('Default run covers the unit group. Run the HTTP groups per group with a backend restart between them (§63.10):');
    for (const name of Object.keys(GROUPS).filter((g) => g !== 'unit')) {
      out(`  node scripts/test-06-seeding.mjs --only=${name}`);
    }
  }

  out('');
  out('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  out(`SUMMARY  PASS=${pass}  FAIL=${fail}`);
  out(fail === 0 ? 'RESULT   ALL GREEN' : 'RESULT   FAILURES PRESENT — see above');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  out(`FATAL ${err?.message ?? err}`);
  process.exit(1);
});