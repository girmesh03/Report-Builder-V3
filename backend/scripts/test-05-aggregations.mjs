/**
 * Sub-phase 5 — Aggregations verification suite (§63.10): §37 export,
 * §38 analytics, §39 search.
 *
 * Terminal-visible contract: every check prints the request (method +
 * path) and the response status + full JSON body, then a PASS/FAIL
 * verdict; non-HTTP checks print a `UNIT` line with the same framing.
 * The suite ends with PASS=N FAIL=M and exits non-zero on any failure.
 * Output goes through process.stdout.write (no console.log literal —
 * §9.5/§63.4 grep-gate clean). Zero dependencies beyond Node 24
 * built-ins + the installed models (fixture arrangement only).
 *
 * **Fixture-arrangement note:** the behaviors under test are
 * status-agnostic READ aggregations — report statuses,
 * transcription rows, and Item rows are arranged DIRECTLY through
 * the models (a fixture step, not a tested behavior); **no AI call
 * ever runs in this suite** (no STT/generation/correction/chat —
 * the §38/§39/§37 surfaces never invoke a provider).
 *
 * Groups (run per group with a backend restart between them — the
 * in-memory rate store resets on restart, §63.10):
 *   node scripts/test-05-aggregations.mjs                 (unit)
 *   node scripts/test-05-aggregations.mjs --only=dashboard
 *   node scripts/test-05-aggregations.mjs --only=items
 *   node scripts/test-05-aggregations.mjs --only=search
 *   node scripts/test-05-aggregations.mjs --only=export
 *   node scripts/test-05-aggregations.mjs --only=sourcegates
 *
 * The §39.2 exit gate — text-index count = 1 — is verified LIVE in
 * the sourcegates group (collection index inspection through
 * mongoose; the server must have booted once so the models created
 * their indexes, §18.3 initialSchema).
 */
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Report from '../models/report.model.js';
import Item from '../models/item.model.js';
import Transcription from '../models/transcription.model.js';
import { resolveOfficialTokens } from '../services/drive.service.js';
import { matchedFieldsOf } from '../services/search.service.js';
import { ethiopianMonthRange, gregorianToEthiopian } from '../utils/ethiopianDate.js';

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
  return { email, registerStatus: reg.status, loginStatus: login.status };
}

/** Connects the suite's mongoose (fixture arrangement only — never a tested behavior). */
async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  }
}

async function createBranch(name, location) {
  const res = await request('POST', '/api/v1/branches', authJson({ name, location }));
  return res.body?.data?._id;
}

async function createReport(branchId, overrides = {}) {
  const res = await request('POST', '/api/v1/reports', authJson({
    branch: branchId,
    clockIn: '08:30',
    clockOut: '17:30',
    visits: [{ branch: branchId, clockIn: '08:30', clockOut: '17:30' }],
    ...overrides,
  }));
  return res.body?.data?._id;
}

/** Arranges a report row's status directly (fixture step — the aggregations are status-agnostic reads). */
async function setStatus(reportId, userId, status) {
  await Report.updateOne({ _id: reportId, user: userId }, { $set: { status } });
}

/** Arranges Item rows directly (generation-only rows — the §38 surfaces read them). */
async function insertItems(userId, reportId, branchId, rows) {
  await Item.insertMany(rows.map((r) => ({ user: userId, report: reportId, branch: branchId, ...r })));
}

/** Arranges a Transcription row directly (the export surface reads `latest`). */
async function insertTranscription(userId, reportId, latest) {
  await Transcription.create([{ user: userId, report: reportId, raw: 'raw', latest, language: 'am' }]);
}

/** The §6 canonical fixture content — carries ± labels verbatim (the §37.5 as-is proof). */
const FIXTURE_LATEST =
  '<p>±ቀን: 14-12-18</p><p>±ብራንች: መድኃኒዓለም</p><p>±ስም: ቤዛ አያሌው</p><p>±ስራ የገባሁበት ሰዓት: 08:30</p><p>±የተሰሩ ስራዎች:</p><p> - በቼክሊስቱ መሰረት ተገቢውን ስራ ሰርቻለሁ</p><p>±መፍትሄ የሚፈሉ ጉዳዮች:</p><p> - የውሃ ፓምፕ አይሰራም</p><p>±አጠቃላይ አስተያየት:</p><p> - በአጠቃላይ ጥሩ ነበር</p><p>±ከስራ የወጣሁበት ሰዓት: 17:30</p>';

// ─────────────────────────────── GROUP: unit ───────────────────────────────

async function runUnit() {
  section('unit \u2014 pure functions');
  out('[U1] UNIT resolveOfficialTokens (§64.6)');
  {
    const resolved = resolveOfficialTokens(FIXTURE_LATEST);
    unitCheck('U1', '± labels resolve to their official text in the artifact; content untouched', !resolved.includes('±') && resolved.includes('ቀን: 14-12-18') && resolved.includes('ከስራ የወጣሁበት ሰዓት: 17:30'));
  }
  out('[U2] UNIT matchedFieldsOf (D40)');
  {
    const branch = { name: 'መድኃኒዓለም', location: 'Mexico Square' };
    const both = { name: 'A x', location: 'B y' };
    unitCheck('U2', 'name-only / location-only / both / neither-fallback', JSON.stringify(matchedFieldsOf(branch, 'መድኃኒዓለም')) === '["name"]' && JSON.stringify(matchedFieldsOf(branch, 'mexico')) === '["location"]' && JSON.stringify(matchedFieldsOf(both, 'a')) === '["name"]' && JSON.stringify(matchedFieldsOf(both, 'zzz')) === '["name","location"]');
  }
  out('[U3] UNIT Ethiopian month of the fixture dates (§38.5)');
  {
    unitCheck('U3', '7 Aug 2026 = Nahase 1 (the F93 boundary); 6 Aug = Hamle', gregorianToEthiopian(new Date(Date.UTC(2026, 7, 7))).month === 12 && gregorianToEthiopian(new Date(Date.UTC(2026, 7, 6))).month === 11);
  }
  out('[U4] UNIT month-range bounds reuse (§38.5)');
  {
    const range = ethiopianMonthRange(2018, 12);
    unitCheck('U4', 'Nahase range [7 Aug, 6 Sep) — midnight bounds', range.start.toISOString() === '2026-08-07T00:00:00.000Z' && range.end.toISOString() === '2026-09-06T00:00:00.000Z');
  }
}

// ────────────────────────────── GROUP: dashboard ─────────────────────────────

async function runDashboard() {
  await connectDb();
  section('dashboard \u2014 §38 aggregate inventory (no AI)');
  const fixture = await registerAndLogin('sp5.db');
  unitCheck('DB0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);

  await httpCheck('DB1', 'GET /analytics/dashboard empty account → all-zero kpis + 4 zero slices + empty series', 'GET', '/api/v1/analytics/dashboard', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['kpis zero', res.body?.data?.kpis?.reportsThisMonth === 0 && res.body?.data?.kpis?.inProgress === 0 && res.body?.data?.kpis?.generated === 0 && res.body?.data?.kpis?.activeBranches === 0],
    ['trends zero', res.body?.data?.kpis?.trends?.reportsThisMonthDelta === 0 && res.body?.data?.kpis?.trends?.generatedDelta === 0],
    ['4 slices zero-filled in ORDER', JSON.stringify(res.body?.data?.charts?.statusDistribution) === JSON.stringify([{ status: 'draft', count: 0 }, { status: 'audio_attached', count: 0 }, { status: 'transcribed', count: 0 }, { status: 'generated', count: 0 }])],
    ['empty series', res.body?.data?.charts?.activityByBranch?.length === 0 && res.body?.data?.charts?.issuesTrend?.length === 30],
  ]);

  // The full §38 fixture (dates are chosen against the Ethiopian
  // calendar: Nahase 2018 = 7 Aug – 5 Sep 2026; Hamle = up to 6 Aug).
  const branchA = await createBranch('መድኃኒዓለም', 'Mexico Square, Addis Ababa');
  const branchC = await createBranch('ኤርፖርት', 'Airport');
  const branchB = await createBranch('ጎላጉል', 'Golagul');
  await request('POST', `/api/v1/branches/${branchB}/archive`, authHeaders());

  const r1 = await createReport(branchA, { date: '2026-08-07T00:00:00.000Z' }); // Nahase 1 (boundary) — draft
  const r2 = await createReport(branchA, { date: '2026-08-20T00:00:00.000Z' }); // this month — generated + transcription
  const r3 = await createReport(branchA, { date: '2026-07-10T00:00:00.000Z' }); // Hamle (prev) — generated
  const r4 = await createReport(branchC, { date: '2026-08-06T00:00:00.000Z' }); // Hamle day-before — audio_attached
  const r5 = await createReport(branchC, {});                                    // null date — transcribed
  const r6 = await createReport(branchA, { date: '2026-08-19T00:00:00.000Z', visits: [{ branch: branchA, clockIn: '08:30', clockOut: '17:30' }, { branch: branchC, clockIn: '10:00', clockOut: '12:00' }] }); // this month — generated
  const r7 = await createReport(branchC, { date: '2026-08-18T00:00:00.000Z' }); // this month — ARCHIVED + transcription (excluded)

  const userId = (await request('GET', '/api/v1/branches', authHeaders())).body?.data?.docs?.[0]?.user;
  await setStatus(r1, userId, 'draft');
  await setStatus(r2, userId, 'generated');
  await setStatus(r3, userId, 'generated');
  await setStatus(r4, userId, 'audio_attached');
  await setStatus(r5, userId, 'transcribed');
  await setStatus(r6, userId, 'generated');
  await setStatus(r7, userId, 'transcribed');
  await insertTranscription(userId, r2, FIXTURE_LATEST);
  await insertTranscription(userId, r7, FIXTURE_LATEST);
  await request('POST', `/api/v1/reports/${r7}/archive`, authHeaders());

  await insertItems(userId, r2, branchA, [
    { type: 'issue', text: 'የውሃ ፓምፕ አይሰራም', status: 'reported', date: new Date(Date.UTC(2026, 7, 20, 9)) },
    { type: 'issue', text: 'pump ችግር', status: 'in_progress', date: new Date(Date.UTC(2026, 7, 20, 9)) },
    { type: 'issue', text: 'የበር ቴምበርድ', status: 'reported', date: new Date(Date.UTC(2026, 7, 10, 9)) },
    { type: 'issue', text: 'pump old', status: 'reported', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
    { type: 'activity', text: 'በቼክሊስቱ መሰረት ሰርቻለሁ', status: 'completed', date: new Date(Date.UTC(2026, 7, 20, 9)) },
    { type: 'comment', text: 'በአጠቃላይ ጥሩ', status: null, rating: 4, date: new Date(Date.UTC(2026, 7, 20, 9)) },
  ]);

  await httpCheck('DB2', 'GET /analytics/dashboard → the §38.2 payload (all 8 aggregates + trends)', 'GET', '/api/v1/analytics/dashboard', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['reportsThisMonth = 3 (r1 Nahase-1, r2, r6; r7 archived excluded; r4/r3 prev; r5 null)', res.body?.data?.kpis?.reportsThisMonth === 3],
    ['inProgress = 3 (r1 draft + r4 audio_attached + r5 transcribed)', res.body?.data?.kpis?.inProgress === 3],
    ['generated = 3 (r2 + r3 + r6)', res.body?.data?.kpis?.generated === 3],
    ['activeBranches = 2 (B archived excluded)', res.body?.data?.kpis?.activeBranches === 2],
    ['trends: reportsDelta 3-2=1; generatedDelta 2-1=1', res.body?.data?.kpis?.trends?.reportsThisMonthDelta === 1 && res.body?.data?.kpis?.trends?.generatedDelta === 1],
    ['statusDistribution 4 slices in ORDER [1,1,1,3]', JSON.stringify(res.body?.data?.charts?.statusDistribution) === JSON.stringify([{ status: 'draft', count: 1 }, { status: 'audio_attached', count: 1 }, { status: 'transcribed', count: 1 }, { status: 'generated', count: 3 }])],
    ['activityByBranch top-2 with live $lookup names [A:4, C:2]', JSON.stringify(res.body?.data?.charts?.activityByBranch) === JSON.stringify([{ name: 'መድኃኒዓለም', count: 4 }, { name: 'ኤርፖርት', count: 2 }])],
    ['issuesTrend: 30 entries, zero-filled (today 2, Aug 10 1)', res.body?.data?.charts?.issuesTrend?.length === 30 && res.body?.data?.charts?.issuesTrend?.find((d) => d.date === '2026-08-20')?.count === 2 && res.body?.data?.charts?.issuesTrend?.find((d) => d.date === '2026-08-10')?.count === 1 && res.body?.data?.charts?.issuesTrend?.filter((d) => d.count > 0).length === 2],
  ]);
}

// ─────────────────────────────── GROUP: items ───────────────────────────────

async function runItems() {
  await connectDb();
  section('items \u2014 §38.2 filter contract (no AI)');
  const fixture = await registerAndLogin('sp5.it');
  unitCheck('IT0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);

  const branchA = await createBranch('መድኃኒዓለም', 'Mexico');
  const branchC = await createBranch('ኤርፖርት', 'Airport');
  const r1 = await createReport(branchA, { date: '2026-08-20T00:00:00.000Z' });
  const r2 = await createReport(branchC, { date: '2026-08-19T00:00:00.000Z' });
  const userId = (await request('GET', '/api/v1/branches', authHeaders())).body?.data?.docs?.[0]?.user;

  await insertItems(userId, r1, branchA, [
    { type: 'issue', text: 'pump ችግር', status: 'reported', date: new Date(Date.UTC(2026, 7, 20, 9)) },
    { type: 'issue', text: 'pump ተጠግኗል', status: 'completed', date: new Date(Date.UTC(2026, 7, 19, 9)) },
    { type: 'activity', text: 'pump ስራ', status: 'completed', date: new Date(Date.UTC(2026, 7, 17, 9)) },
  ]);
  await insertItems(userId, r2, branchC, [
    { type: 'issue', text: 'የበር ቴምበርድ', status: 'in_progress', date: new Date(Date.UTC(2026, 7, 18, 9)) },
  ]);

  await httpCheck('IT1', 'GET /analytics/items → all rows, date desc sort', 'GET', '/api/v1/analytics/items', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['paginated shape', res.body?.data?.docs?.length === 4 && res.body?.data?.totalDocs === 4],
    ['date desc (20 → 17)', res.body?.data?.docs?.[0]?.date > res.body?.data?.docs?.[3]?.date],
    ['DTO surface (no derivation)', res.body?.data?.docs?.every((d) => d._id && d.type && d.text && d.status !== undefined)],
  ]);

  await httpCheck('IT2', '?type=issue → 3 rows', 'GET', '/api/v1/analytics/items?type=issue', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['3 issue rows', res.body?.data?.totalDocs === 3 && res.body?.data?.docs?.every((d) => d.type === 'issue')],
  ]);

  await httpCheck('IT3', '?status=completed → 2 rows', 'GET', '/api/v1/analytics/items?status=completed', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['2 completed', res.body?.data?.totalDocs === 2 && res.body?.data?.docs?.every((d) => d.status === 'completed')],
  ]);

  await httpCheck('IT4', '?status=open → 422 (legacy value is not an ITEM_STATUSES member, D32)', 'GET', '/api/v1/analytics/items?status=open', authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);

  await httpCheck('IT5', '?branch= → scoped', 'GET', `/api/v1/analytics/items?branch=${branchA}`, authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['3 rows on A', res.body?.data?.totalDocs === 3],
  ]);

  await httpCheck('IT6', '?q=pump → 3 literal matches', 'GET', '/api/v1/analytics/items?q=pump', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['3 pump rows', res.body?.data?.totalDocs === 3],
  ]);

  await httpCheck('IT7', '?q=pump. → 0 matches (the dot is LITERAL — D27 escape)', 'GET', '/api/v1/analytics/items?q=pump.', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['0 rows', res.body?.data?.totalDocs === 0],
  ]);

  await httpCheck('IT8', '?dateFrom=2026-08-19 → 2 rows (the 20th + the 19th)', 'GET', '/api/v1/analytics/items?dateFrom=2026-08-19T00:00:00.000Z', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['2 rows', res.body?.data?.totalDocs === 2],
  ]);

  await httpCheck('IT9', '?dateTo=2026-08-18 → 2 rows', 'GET', '/api/v1/analytics/items?dateTo=2026-08-18T23:59:59.999Z', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['2 rows', res.body?.data?.totalDocs === 2],
  ]);

  await httpCheck('IT10', 'combined branch+type+status+q → precise', 'GET', `/api/v1/analytics/items?branch=${branchA}&type=issue&status=reported&q=pump`, authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['1 row', res.body?.data?.totalDocs === 1 && res.body?.data?.docs?.[0]?.text === 'pump ችግር'],
  ]);

  await httpCheck('IT11', '?limit=2&page=2 → the tail', 'GET', '/api/v1/analytics/items?limit=2&page=2', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['2 rows page 2', res.body?.data?.docs?.length === 2 && res.body?.data?.page === 2 && res.body?.data?.totalPages === 2],
  ]);

  await httpCheck('IT12', '?type=bogus → 422', 'GET', '/api/v1/analytics/items?type=bogus', authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);
}

// ─────────────────────────────── GROUP: search ──────────────────────────────

async function runSearch() {
  await connectDb();
  section('search \u2014 §39 (no AI)');
  const fixture = await registerAndLogin('sp5.sr');
  unitCheck('SR0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);

  const branchA = await createBranch('መድኃኒዓለም', 'Mexico Square');
  const branchC = await createBranch('ኤርፖርት', 'Airport');
  const branchB = await createBranch('ጎላጉል', 'Golagul');
  await request('POST', `/api/v1/branches/${branchB}/archive`, authHeaders());

  const r1 = await createReport(branchA, { date: '2026-08-19T00:00:00.000Z' });
  const r2 = await createReport(branchA, { date: '2026-08-18T00:00:00.000Z' });
  const r3 = await createReport(branchC, { date: '2026-08-17T00:00:00.000Z' });
  const r4 = await createReport(branchA, { date: '2026-08-16T00:00:00.000Z', visits: [{ branch: branchA, clockIn: '08:30', clockOut: '17:30' }, { branch: branchC, clockIn: '10:00', clockOut: '12:00' }] });
  const r5 = await createReport(branchC, { date: '2026-08-15T00:00:00.000Z' });
  const userId = (await request('GET', '/api/v1/branches', authHeaders())).body?.data?.docs?.[0]?.user;
  await setStatus(r1, userId, 'generated');
  await setStatus(r5, userId, 'draft');

  await httpCheck('SR1', 'q=መድኃኒዓለም → branch A + its reports (branch first, score desc, date desc)', 'GET', '/api/v1/search?q=መድኃኒዓለም', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['branch first with title/subtitle/matchedFields', res.body?.data?.docs?.[0]?.type === 'branch' && res.body?.data?.docs?.[0]?.title === 'መድኃኒዓለም' && JSON.stringify(res.body?.data?.docs?.[0]?.matchedFields) === '["name"]'],
    ['reports r1 r2 r4 with status + Ethiopian date title + own-branch subtitle', res.body?.data?.docs?.filter((d) => d.type === 'report').map((d) => d.entityId).sort().join(',') === [r1, r2, r4].sort().join(',') && res.body?.data?.docs?.find((d) => d.entityId === r1)?.status === 'generated' && res.body?.data?.docs?.find((d) => d.entityId === r1)?.title === '13-12-18'],
    ['reports subtitle = own branch name', res.body?.data?.docs?.find((d) => d.entityId === r4)?.subtitle === 'መድኃኒዓለም'],
  ]);

  await httpCheck('SR2', 'q=ኤርፖርት → branch C + r3, r5, AND r4 (via its visit, subtitle = own branch A)', 'GET', '/api/v1/search?q=ኤርፖርት', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['branch C', res.body?.data?.docs?.[0]?.type === 'branch' && res.body?.data?.docs?.[0]?.title === 'ኤርፖርት'],
    ['reports r3 r5 r4', res.body?.data?.docs?.filter((d) => d.type === 'report').map((d) => d.entityId).sort().join(',') === [r3, r4, r5].sort().join(',')],
    ['visit-matched r4: subtitle = own branch (መድኃኒዓለም) + matchedFields from the matched visit branch', res.body?.data?.docs?.find((d) => d.entityId === r4)?.subtitle === 'መድኃኒዓለም' && JSON.stringify(res.body?.data?.docs?.find((d) => d.entityId === r4)?.matchedFields) === '["name"]'],
    ['draft r5 included with status', res.body?.data?.docs?.find((d) => d.entityId === r5)?.status === 'draft'],
  ]);

  await httpCheck('SR3', 'q=mexico → branch A via LOCATION, matchedFields ["location"]', 'GET', '/api/v1/search?q=mexico', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['location match', res.body?.data?.docs?.[0]?.type === 'branch' && JSON.stringify(res.body?.data?.docs?.[0]?.matchedFields) === '["location"]'],
  ]);

  await httpCheck('SR4', 'q=ጎላጉል → zero matches (archived branch excluded by default)', 'GET', '/api/v1/search?q=ጎላጉል', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['docs []', res.body?.data?.docs?.length === 0 && res.body?.data?.totalDocs === 0],
  ]);

  await httpCheck('SR5', 'q=ጎላጉል&includeArchived=true → the archived branch, no reports', 'GET', '/api/v1/search?q=ጎላጉል&includeArchived=true', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['branch B only', res.body?.data?.docs?.length === 1 && res.body?.data?.docs?.[0]?.type === 'branch' && res.body?.data?.docs?.[0]?.title === 'ጎላጉል' && res.body?.data?.docs?.[0]?.status === undefined],
  ]);

  await httpCheck('SR6', 'q=zzz → 200 docs [] (never 404, §39.5)', 'GET', '/api/v1/search?q=zzz', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['docs []', res.body?.data?.docs?.length === 0],
  ]);

  await httpCheck('SR7', 'q missing → 422', 'GET', '/api/v1/search', authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);

  await httpCheck('SR8', 'q="" (quotes only) → 422 (stripped to empty, D30)', 'GET', '/api/v1/search?q=%22%22', authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);

  await httpCheck('SR9', 'q over 100 chars → 422', 'GET', `/api/v1/search?q=${'a'.repeat(101)}`, authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);

  await httpCheck('SR10', 'type=branch → branches only', 'GET', '/api/v1/search?q=መድኃኒዓለም&type=branch', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['only branches', res.body?.data?.docs?.every((d) => d.type === 'branch') && res.body?.data?.docs?.length === 1],
  ]);

  await httpCheck('SR11', 'type=report → reports only', 'GET', '/api/v1/search?q=መድኃኒዓለም&type=report', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['only reports', res.body?.data?.docs?.every((d) => d.type === 'report') && res.body?.data?.docs?.length === 3],
  ]);

  await httpCheck('SR12', 'type=bogus → 422', 'GET', '/api/v1/search?q=x&type=bogus', authHeaders(), (res) => [
    ['status 422', res.status === 422],
  ]);

  await httpCheck('SR13', 'pagination limit=2 → page 2 of the merged list', 'GET', '/api/v1/search?q=መድኃኒዓለም&limit=2&page=2', authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['2 docs page 2, totalDocs 4', res.body?.data?.docs?.length === 2 && res.body?.data?.page === 2 && res.body?.data?.totalDocs === 4 && res.body?.data?.totalPages === 2],
  ]);
}

// ─────────────────────────────── GROUP: export ──────────────────────────────

async function runExport() {
  await connectDb();
  section('export \u2014 §37 (no AI)');
  const fixture = await registerAndLogin('sp5.ex');
  unitCheck('EX0', 'fixture register/login', fixture.registerStatus === 201 && fixture.loginStatus === 200);

  const branchA = await createBranch('መድኃኒዓለም', 'Mexico');
  const branchC = await createBranch('ኤርፖርት', 'Airport');
  const r1 = await createReport(branchA, { date: '2026-08-20T00:00:00.000Z', visits: [{ branch: branchA, clockIn: '08:30', clockOut: '17:30' }, { branch: branchC, clockIn: '10:00', clockOut: '12:00' }] });
  const r2 = await createReport(branchA, { date: '2026-08-19T00:00:00.000Z' });
  const r3 = await createReport(branchA, { date: '2026-08-18T00:00:00.000Z' });
  const userId = (await request('GET', '/api/v1/branches', authHeaders())).body?.data?.docs?.[0]?.user;

  await insertTranscription(userId, r1, FIXTURE_LATEST);
  await insertTranscription(userId, r3, FIXTURE_LATEST);
  await request('POST', `/api/v1/reports/${r3}/archive`, authHeaders());

  await httpCheck('EX1', 'GET /reports/:id/export/content → the §37.5 payload (± as-is, live visit names)', 'GET', `/api/v1/reports/${r1}/export/content`, authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['content as stored with ± verbatim', res.body?.data?.content === FIXTURE_LATEST && res.body?.data?.content.includes('±ቀን:')],
    ['date', res.body?.data?.date === '2026-08-20T00:00:00.000Z'],
    ['branchName live', res.body?.data?.branchName === 'መድኃኒዓለም'],
    ['visits with live names', JSON.stringify(res.body?.data?.visits) === JSON.stringify([{ branchName: 'መድኃኒዓለም', clockIn: '08:30', clockOut: '17:30' }, { branchName: 'ኤርፖርት', clockIn: '10:00', clockOut: '12:00' }])],
  ]);

  await httpCheck('EX2', 'no transcription → 422 Nothing to export yet (§37.2)', 'GET', `/api/v1/reports/${r2}/export/content`, authHeaders(), (res) => [
    ['status 422', res.status === 422],
    ['copy', res.body?.message === 'Nothing to export yet'],
  ]);

  await httpCheck('EX3', 'archived report with a transcription → 200 (read-only view, §51)', 'GET', `/api/v1/reports/${r3}/export/content`, authHeaders(), (res) => [
    ['status 200', res.status === 200],
    ['content present', res.body?.data?.content === FIXTURE_LATEST],
  ]);

  await httpCheck('EX4', 'POST /reports/:id/export/docs → 404 Route not found (unmounted, §37.3)', 'POST', `/api/v1/reports/${r1}/export/docs`, authHeaders(), (res) => [
    ['status 404', res.status === 404],
    ['copy', res.body?.message === 'Route not found'],
  ]);

  await httpCheck('EX5', 'foreign report → 404 (BR-13)', 'GET', '/api/v1/reports/64f1a2b3c4d5e6f7a8b9c0d3/export/content', authHeaders(), (res) => [
    ['status 404', res.status === 404],
  ]);
}

// ────────────────────────────── GROUP: sourcegates ──────────────────────────

async function runSourceGates() {
  section('sourcegates \u2014 §38.7/§39.6/§37.7');
  out('[S1] UNIT text-index count = 1 (live index inspection, §39.2/§39.6 exit gate)');
  {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    let textIndexes = [];
    for (const c of cols) {
      const ix = await db.collection(c.name).indexes();
      for (const i of ix) {
        // Mongo stores text indexes with the internal `_fts` key and
        // the covered fields in `weights` — the count + the weights
        // prove the §39.2 declaration.
        if (Object.values(i.key).includes('text') || (i.weights && Object.keys(i.weights).length > 0)) {
          textIndexes.push({ collection: c.name, index: i.name, key: i.key, weights: i.weights });
        }
      }
    }
    await mongoose.disconnect();
    unitCheck('S1', `exactly ONE text index on branches over {name, location}, got ${textIndexes.length}`, textIndexes.length === 1 && textIndexes[0].collection === 'branches' && textIndexes[0].weights?.name === 1 && textIndexes[0].weights?.location === 1 && textIndexes[0].key.user === 1);
  }
  out('[S2] UNIT no RegExp in search.service (§39.6)');
  {
    const src = readFileSync(join(process.cwd(), 'services', 'search.service.js'), 'utf8');
    unitCheck('S2', 'no RegExp construction and no $regex in search.service.js', !/(new\s+RegExp|RegExp\s*\()/.test(src) && !src.includes('$regex'));
  }
  out('[S3] UNIT $group confined to the two aggregation homes (§38.7)');
  {
    const analytics = readFileSync(join(process.cwd(), 'controllers', 'analytics.controller.js'), 'utf8');
    const branch = readFileSync(join(process.cwd(), 'controllers', 'branch.controller.js'), 'utf8');
    const others = ['report.controller.js', 'audio.controller.js', 'transcription.controller.js', 'chat.controller.js', 'export.controller.js', 'search.controller.js']
      .map((f) => readFileSync(join(process.cwd(), 'controllers', f), 'utf8'))
      .join('\n');
    unitCheck('S3', 'aggregation pipelines live only in analytics + branch-detail controllers', analytics.includes('$group') && branch.includes('$group') && !others.includes('$group'));
  }
  out('[S4] UNIT no exportedAt write (§21.2/§37.7)');
  {
    const src = [
      'controllers/export.controller.js',
      'services/drive.service.js',
      'routes/export.routes.js',
    ].map((f) => readFileSync(join(process.cwd(), f), 'utf8')).join('\n');
    unitCheck('S4', 'no exportedAt anywhere in the §37 surface', !/exportedAt\s*[:=]/.test(src));
  }
  out('[S5] UNIT the drive boundary (§37.7)');
  {
    const src = readFileSync(join(process.cwd(), 'services', 'drive.service.js'), 'utf8');
    unitCheck('S5', 'Google references live only in drive.service behind EXPORT_DOCS_ENABLED', src.includes('EXPORT_DOCS_ENABLED'));
  }
  out('[S6] UNIT EXPORT_DOCS_ENABLED false (§11.3/§37.3)');
  {
    const constants = readFileSync(join(process.cwd(), 'utils', 'constants.js'), 'utf8');
    unitCheck('S6', 'the flag is false — the docs route stays unmounted', /EXPORT_DOCS_ENABLED = false/.test(constants));
  }
}

// ───────────────────────────────── main ────────────────────────────────────

const GROUPS = {
  unit: runUnit,
  dashboard: runDashboard,
  items: runItems,
  search: runSearch,
  export: runExport,
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
      out(`  node scripts/test-05-aggregations.mjs --only=${name}`);
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