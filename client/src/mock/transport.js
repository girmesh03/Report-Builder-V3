/**
 * @module mock/transport
 *
 * The §66.10 development mock adapter: a plain client module (no
 * package) implementing the §42 query contracts over §40 fixture
 * data. It mirrors the §17/§27 DTO and envelope transforms exactly —
 * every response is the `{ success, message, data }` envelope of
 * §27.4 (or its error form with `details` for 422), and the DTO
 * surfaces of §19/§20/§21/§22/§23/§24/§28 — so page code cannot tell
 * the adapter from the real API.
 *
 * Session model: the adapter simulates the §28 cookie session with
 * an in-memory active session (access + refresh tokens, §28.2 TTL
 * semantics); `POST /auth/refresh` rotates tokens and the access
 * token expires on its §28.2 window, exercising the §42.3 reauth
 * chain. Domain routes are personally scoped (BR-13) and mirror the
 * §31.4 transition guards (last-clip rewind, accept gate, 403 on
 * archived/completed etc.), the §30 two-path lifecycle, the §31.6
 * accept 422 (unassigned-items gate), the §39 text search, the §38
 * server-side aggregates (the adapter is the "server" — the client
 * never aggregates), and the §36 conversation append with a
 * deterministic canned assistant reply (reason vocabulary of §35.4
 * only — no invented copy). It is wired dev-only at the §42
 * boundary (apiSlice.js) and **never exists in a production build**;
 * deleted at P7 (§66.10).
 *
 * Error seeding (§66.10 — "the pages and their §60 states are
 * exercised"): the adapter exposes `seedError(status)` for the §63
 * manual walkthroughs — rate-limit (429) and provider-failure (502)
 * states cannot be expressed by fixtures, so a devtools-console
 * call (`seedError(502)`) makes every subsequent request fail with
 * that status until `seedError(null)` clears it. Page code never
 * calls it; it dies with the adapter at P7.
 *
 * Session persistence (§66.10 — dev convenience, owner-approved):
 * the simulated §28 cookie session survives page reloads by
 * mirroring the active session to `localStorage` (the browser's
 * session storage stands in for the real httpOnly cookie). The
 * mirror is an exact copy of the live session incl. `userId`, so a
 * reload restores and authenticates it. On boot with no live
 * stored session (or one whose user vanished — registered accounts
 * are in-memory only) the adapter auto-signs-in the seeded
 * supervisor, so a refresh never drops the developer out of
 * authentication; an explicit logout clears the mirror until the
 * next reload. Within a page load the TTL semantics are unchanged:
 * an expired access token still 401s and the §42.3 reauth chain
 * ends on /login once the refresh TTL passes. Everything guarded
 * for environments without `localStorage` (node runs, hardened
 * browsers); the key dies with the adapter at P7.
 */
import dayjs from "dayjs";
import {
  MOCK_ADAPTER,
  MOCK_USERS,
  MOCK_BRANCHES,
  MOCK_REPORTS,
  MOCK_CLIPS,
  MOCK_TRANSCRIPTIONS,
  MOCK_CONVERSATIONS,
  MOCK_SESSIONS,
} from "./fixtures";
import { httpStatus } from "../utils/httpStatus";
import {
  REPORT_STATUSES,
  AUDIO_ALLOWED_MIME_TYPES,
  AUDIO_MAX_SIZE_BYTES,
  AUDIO_MAX_DURATION_SEC,
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
  OFFICIAL_TOKEN_PREFIX,
} from "../utils/constants";
import { gregorianToEthiopian } from "../utils/ethiopianDate";

const { latencyMs, accessTokenTtlMs, refreshTokenTtlMs } = MOCK_ADAPTER;

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_TAKEN_MESSAGE = "This email is already registered";
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const GOOGLE_STUB_MESSAGE = "Google sign-in is not available in this version";
const SESSION_EXPIRED_MESSAGE = "Session expired";
const TT_MESSAGE = "Route not found";
const UNASSIGNED_GATE_MESSAGE = "Assign the unassigned items before accepting this report";
const STATUS_FORBIDDEN_MESSAGE = "This action is not allowed in the current report status";
const ARCHIVED_FORBIDDEN_MESSAGE = "Archived reports are read-only";
const REPORT_NOT_FOUND_MESSAGE = "Report not found";
const BRANCH_NOT_FOUND_MESSAGE = "Branch not found";
const AUDIO_NOT_FOUND_MESSAGE = "Audio not found";
const TRANSCRIPTION_NOT_FOUND_MESSAGE = "Transcription not found";
const SESSION_NOT_FOUND_MESSAGE = "Session not found";
const NO_AUDIO_MESSAGE = "Add audio clips before transcribing";
const ALL_TRANSCRIBED_MESSAGE = "All clips are already transcribed";
const CLONE = (value) => structuredClone(value);

/**
 * The §66.10 error seed — see the module docblock. One-shot is
 * deliberately avoided: §60 walkthroughs re-trigger retries, and a
 * persistent seed until `seedError(null)` keeps the state
 * deterministic.
 * @type {number|null}
 */
let errorSeed = null;

/**
 * Devtools-only seed setter (§66.10). `seedError(null)` clears it.
 * @param {number|null} status - Status code to fail with (e.g. 429, 502).
 */
export const seedError = (status) => {
  errorSeed = status;
};

const seededFailure = () => {
  if (errorSeed == null) {
    return null;
  }
  const message =
    errorSeed === httpStatus.TOO_MANY_REQUESTS
      ? "Too many requests — slow down and try again"
      : "The AI service is unavailable right now — try again later";
  return error(errorSeed, message);
};

/** Mutable copies — the adapter is stateful, fixtures are the seed. */
const users = MOCK_USERS.map(CLONE);
const branches = MOCK_BRANCHES.map(CLONE);
const reports = MOCK_REPORTS.map(CLONE);
const clips = MOCK_CLIPS.map(CLONE);
const transcriptions = MOCK_TRANSCRIPTIONS.map(CLONE);
const conversations = MOCK_CONVERSATIONS.map(CLONE);
const sessions = MOCK_SESSIONS.map(CLONE);

/**
 * The `localStorage` mirror key of the simulated §28 session
 * (§66.10 — see the module docblock); dev-only, dies at P7.
 * @type {string}
 */
const SESSION_STORAGE_KEY = "mock.activeSession";

/** Storage access that never throws (node, privacy modes). */
const sessionStorage = () => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

/** Restores the persisted session, if any (TTL-checked on use). */
const readStoredSession = () => {
  const store = sessionStorage();
  if (!store) {
    return null;
  }
  try {
    const raw = store.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Mirrors the active session to storage; `null` clears the mirror. */
const persistSession = (session) => {
  const store = sessionStorage();
  if (!store) {
    return;
  }
  try {
    if (session) {
      store.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      store.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // storage unavailable — the session stays in-memory
  }
};

let activeSession = readStoredSession();
let counters = { clip: 100, transcription: 100, conversation: 100, session: 100, digest: 100 };

const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs));

/** In-place filter on a const array (permanent-delete cascade). */
const retainWhere = (array, predicate) => {
  array.splice(0, array.length, ...array.filter(predicate));
};

const randomToken = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const toUserDto = (user) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  avatar: user.avatar,
  position: user.position,
});

const toBranchDto = (branch) => ({
  _id: branch._id,
  user: branch.user,
  name: branch.name,
  location: branch.location,
  isArchived: branch.isArchived,
  archivedAt: branch.archivedAt,
  createdAt: branch.createdAt,
  updatedAt: branch.updatedAt,
});

const toReportDto = (report, withContent) => ({
  _id: report._id,
  user: report.user,
  reportDate: report.reportDate,
  supervisorName: report.supervisorName,
  status: report.status,
  branches: report.branches,
  visits: report.visits,
  ...(withContent
    ? {
        raw: report.raw,
        latest: report.latest,
        branchDigest: report.branchDigest,
      }
    : {}),
  isArchived: report.isArchived,
  archivedAt: report.archivedAt,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const toClipDto = (clip) => ({
  _id: clip._id,
  report: clip.report,
  visitNo: clip.visitNo,
  mimeType: clip.mimeType,
  sizeBytes: clip.sizeBytes,
  durationSec: clip.durationSec,
  createdAt: clip.createdAt,
  updatedAt: clip.updatedAt,
});

const toTranscriptionDto = (row) => ({
  _id: row._id,
  audio: row.audio,
  language: row.language,
  raw: row.raw,
  latest: row.latest,
  stt: row.stt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toConversationDto = (conv) =>
  conv ? { _id: conv._id, user: conv.user, report: conv.report, messages: conv.messages } : null;

const successEnvelope = (data, message = "OK") => ({ success: true, message, data });

const errorEnvelope = (message, details) => ({
  success: false,
  message,
  data: null,
  ...(details ? { details } : {}),
});

const error = (status, message, details) => ({ error: { status, data: errorEnvelope(message, details) } });

const findUser = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase());

const deriveName = (email) => {
  const local = email.split("@")[0];
  const [first, last = ""] = local.split(".");
  const capitalize = (part) =>
    part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "";
  return { firstName: capitalize(first), lastName: capitalize(last) };
};

const startSession = () => {
  const session = {
    _id: `ses-${String(counters.session++).padStart(4, "0")}`,
    access: { token: randomToken("acc"), expiresAt: Date.now() + accessTokenTtlMs },
    refresh: { token: randomToken("ref"), expiresAt: Date.now() + refreshTokenTtlMs },
  };
  activeSession = session;
  persistSession(session);
  return session;
};

/**
 * Starts (or replaces) the active session for a user and mirrors
 * the COMPLETE session — `userId` included — to storage (§66.10):
 * the mirror is an exact copy of the live session, so a reload can
 * restore and authenticate it (the old code persisted before the
 * `userId` merge, so the mirror could never authenticate again).
 */
const startSessionForUser = (user) => {
  const session = { ...startSession(), userId: user._id };
  persistSession(session);
  return session;
};

/**
 * §66.10 dev convenience (owner-approved): on boot with no live
 * stored session the adapter signs in the seeded supervisor, so a
 * page refresh never drops the developer out of authentication.
 * A valid stored session (any seed user) always wins; a stored
 * session whose user no longer exists (registered accounts are
 * in-memory only and vanish on reload) is replaced. Real
 * login/register flows stay reachable after an explicit logout.
 * Dies with the adapter at P7.
 */
const startDevSessionIfNeeded = () => {
  console.error("[r3debug] boot: activeSession=", activeSession, "users=", users.length);
  const hasLiveSession =
    activeSession &&
    activeSession.refresh &&
    Date.now() <= activeSession.refresh.expiresAt &&
    users.some((entry) => entry._id === activeSession.userId);
  console.error("[r3debug] boot: hasLiveSession=", hasLiveSession);
  if (hasLiveSession) {
    return;
  }
  const seededUser = users[0];
  console.error("[r3debug] boot: seeding user=", seededUser?._id);
  if (!seededUser) {
    return;
  }
  startSessionForUser(seededUser);
  console.error("[r3debug] boot: after start, activeSession=", activeSession?._id);
};

startDevSessionIfNeeded();

const sessionUser = () => {
  if (!activeSession) {
    console.error("[r3debug] sessionUser: no active session");
    return null;
  }
  if (Date.now() > activeSession.access.expiresAt) {
    console.error("[r3debug] sessionUser: access expired", activeSession.access.expiresAt, Date.now());
    return null;
  }
  const found = users.find((user) => user._id === activeSession.userId) ?? null;
  console.error("[r3debug] sessionUser: found=", found?._id);
  return found;
};

/** Auth gate for every domain route (BR-13 scoping). */
const requireUser = () => {
  const user = sessionUser();
  if (!user) {
    return { stop: true, value: error(httpStatus.UNAUTHORIZED, SESSION_EXPIRED_MESSAGE) };
  }
  return { stop: false, value: user };
};

const paginate = (docs, page, limit) => {
  const totalDocs = docs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const clamped = Math.min(page, totalPages);
  const start = (clamped - 1) * limit;
  const slice = docs.slice(start, start + limit);
  return { docs: slice, page: clamped, limit, totalDocs, totalPages };
};

const toQuery = (params = {}) => {
  const page = Number.parseInt(params.page ?? "1", 10);
  const limit = Number.parseInt(params.limit ?? "10", 10);
  return { page: Number.isFinite(page) && page > 0 ? page : 1, limit: Number.isFinite(limit) && limit > 0 ? limit : 10 };
};

const formatDate = (value) => (value ? dayjs(value).format("DD-MM-YY") : null);

const compareDesc = (a, b) => (a < b ? 1 : a > b ? -1 : 0);

const perUser = (user, rows) => rows.filter((row) => row.user === user._id);

const reportById = (reportId) => reports.find((report) => report._id === reportId);

const reportOwnerOrNull = (user, reportId) => {
  const report = reportById(reportId);
  if (!report || report.user !== user._id) {
    return null;
  }
  return report;
};

const branchOfUser = (user, branchId) =>
  branches.find((branch) => branch._id === branchId && branch.user === user._id);

const clipsOfReport = (reportId) =>
  clips.filter((clip) => clip.report === reportId).sort((a, b) => compareDesc(b.createdAt, a.createdAt));

const clipsOfVisit = (reportId, visitNo) =>
  clipsOfReport(reportId).filter((clip) => clip.visitNo === Number(visitNo));

const transcriptionsOfReport = (reportId) =>
  transcriptions.filter((row) => {
    const clip = clips.find((entry) => entry._id === row.audio);
    return clip?.report === reportId;
  });

const sentenceSplit = (text) =>
  String(text)
    .split("።")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part}።`);

/**
 * The "generation pipeline" (§34) in mock form: deterministic
 * content built from the report's own capture data — header block
 * (§6.3 fields 1–4), per-visit sections derived from the bound
 * transcriptions (the §6.7 routing), `±` tokens on the first line
 * of each section (official text, verbatim), and a digest of the
 * same items (attribution `binding`/`single-branch-default`, §6.10
 * statuses by position). `raw` is plain text (OQ-007), `latest` is
 * the same content as rich HTML (OQ-007).
 */
const generateContent = (report) => {
  const body = [];
  const visits = report.visits ?? [];
  for (const visit of visits) {
    const visitClips = clipsOfVisit(report._id, visit.visitNo);
    const sentences = visitClips.flatMap((clip) => {
      const row = transcriptions.find((entry) => entry.audio === clip._id);
      return row ? sentenceSplit(row.latest) : [];
    });
    if (!sentences.length) {
      continue;
    }
    body.push(`± ${sentences[0]}`);
    sentences.slice(1).forEach((sentence) => body.push(sentence));
  }
  if (!body.length) {
    body.push(`± የቀኑ እንቅስቃሴ ተመልክቷል።`);
  }
  const raw = [
    `ቀን፡ ${formatDate(report.reportDate) ?? ""}`,
    `ብራንች፡ ${(report.branches ?? []).map((entry) => entry.name).join(" / ")}`,
    `ስም፡ ${report.supervisorName}`,
    `ሰዓት፡ ${visits[0]?.clockIn ?? ""} እስከ ${visits[visits.length - 1]?.clockOut ?? ""}`,
    "",
    "የተሰሩ ስራዎች",
    ...body,
    "",
    "መፍትሄ የሚፈሉ ጉዳዮች",
    `${OFFICIAL_TOKEN_PREFIX} ${body[0] ?? "ችግር አልተገኘም።"}`,
    "",
    "አጠቃላይ አስተያየት",
    `የቀኑ ሂደት በአጠቃላይ ጥሩ ነበር።`,
  ].join("\n");
  const blocks = raw.split(/\n{2,}/);
  const paragraphs = [];
  const headerLines = blocks.shift().split("\n");
  paragraphs.push(`<p>${headerLines.join("<br/>")}</p>`);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length > 1) {
      paragraphs.push(`<p><strong>${lines[0]}</strong></p>`);
      lines.slice(1).forEach((line) => paragraphs.push(`<p>${line}</p>`));
    } else if (lines.length === 1) {
      paragraphs.push(`<p>${lines[0]}</p>`);
    }
  }
  const latest = paragraphs.join("\n");
  const digest = {
    schemaVersion: 1,
    report: { type: visits.length > 1 ? "Type-2" : "Type-1", visits },
    branches: (report.branches ?? []).map((entry, branchIndex) => {
      const branchVisits = visits.filter((visit) => visit.branchName === entry.name);
      const sentences = branchVisits.flatMap((visit) =>
        clipsOfVisit(report._id, visit.visitNo).flatMap((clip) => {
          const row = transcriptions.find((item) => item.audio === clip._id);
          return row ? sentenceSplit(row.latest) : [];
        }),
      );
      const activities = sentences
        .filter((_, index) => index % 3 !== 2)
        .map((text, index) => ({
          itemId: `d-${counters.digest++}`,
          text,
          status: index % 2 === 0 ? "completed" : "in_progress",
          sourceClip: null,
          attributionBasis: visits.length === 1 ? "single-branch-default" : "binding",
        }));
      const issues = sentences
        .filter((_, index) => index % 3 === 2)
        .map((text) => ({
          itemId: `d-${counters.digest++}`,
          text,
          status: "reported",
          sourceClip: null,
          attributionBasis: visits.length === 1 ? "single-branch-default" : "binding",
        }));
      return {
        branchName: entry.name,
        activities,
        issues,
        comment: {
          text: branchIndex === 0 ? "የቀኑ ሂደት በአጠቃላይ ጥሩ ነበር።" : "ሰራተኞቹ በትኩረት ሰርተዋል።",
          rating: branchIndex === 0 ? 4 : 5,
        },
      };
    }),
    unassignedItems: [],
  };
  return { raw, latest, digest };
};

const cannedReply = (instruction) => {
  const mentionsVerb = /ግስ|ድግግም|ተደጋገመ/i.test(instruction);
  const reason = mentionsVerb ? "removed duplicate verb" : "moved case FE paragraph";
  return `<p>ተስተካክሏል — <strong>${reason}</strong> in the addressed section.</p><p>${OFFICIAL_TOKEN_PREFIX} tokens are untouched.</p>`;
};

const updateVisitAudit = (report) => {
  report.updatedAt = new Date().toISOString();
  return report;
};

const archiveReportStep = (report, user, message) => {
  if (report.isArchived) {
    return error(httpStatus.CONFLICT, "This report is already archived");
  }
  report.isArchived = true;
  report.archivedAt = new Date().toISOString();
  report.updatedAt = report.archivedAt;
  return { data: successEnvelope(toReportDto(report), message) };
};

const restoreReportStep = (report, message) => {
  if (!report.isArchived) {
    return error(httpStatus.CONFLICT, "This report is not archived");
  }
  report.isArchived = false;
  report.archivedAt = null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report), message) };
};

/* ------------------------------------------------------------------ */
/* Route table                                                         */
/* ------------------------------------------------------------------ */

const listReportsHandler = (user, params) => {
  const { page, limit } = toQuery(params);
  const { status, branchId, isArchived } = params;
  let rows = perUser(user, reports);
  if (isArchived === "true") {
    rows = rows.filter((report) => report.isArchived);
  } else if (isArchived === "false") {
    rows = rows.filter((report) => !report.isArchived);
  }
  if (status && REPORT_STATUSES.includes(status)) {
    rows = rows.filter((report) => report.status === status);
  }
  if (branchId) {
    rows = rows.filter((report) =>
      (report.branches ?? []).some((entry) => entry.branch === branchId),
    );
  }
  rows = rows.sort((a, b) => {
    const byDate = compareDesc(a.reportDate ?? "", b.reportDate ?? "");
    return byDate !== 0 ? byDate : compareDesc(a.createdAt, b.createdAt);
  });
  return { data: successEnvelope(paginate(rows.map((report) => toReportDto(report)), page, limit)) };
};

const getReportHandler = (user, reportId, params) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope(toReportDto(report, params?.withContent === "true")) };
};

const createReportHandler = (user, body) => {
  const details = [];
  const supervisorName = (body?.supervisorName ?? "").trim();
  if (!supervisorName) {
    details.push({ field: "supervisorName", message: "Supervisor name is required" });
  }
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  const report = {
    _id: `r-${String(counters.digest).padStart(4, "0")}`,
    user: user._id,
    reportDate: body?.reportDate ?? null,
    supervisorName,
    status: "draft",
    branches: [],
    visits: [],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  reports.push(report);
  return { data: successEnvelope(toReportDto(report, true), "Report created") };
};

const updateReportHandler = (user, reportId, body) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  const details = [];
  if (body?.supervisorName !== undefined && !String(body.supervisorName).trim()) {
    details.push({ field: "supervisorName", message: "Supervisor name is required" });
  }
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  if (body?.supervisorName !== undefined) {
    report.supervisorName = String(body.supervisorName).trim();
  }
  if (body?.reportDate !== undefined) {
    report.reportDate = body.reportDate;
  }
  updateVisitAudit(report);
  return { data: successEnvelope(toReportDto(report), "Report updated") };
};

const validateVisitBlock = (user, visits) => {
  const details = [];
  if (!Array.isArray(visits) || visits.length === 0) {
    details.push({ field: "visits", message: "Add at least one visit" });
    return details;
  }
  visits.forEach((visit, index) => {
    const field = `visits[${index}]`;
    const branch = branchOfUser(user, visit?.branchId);
    if (!branch) {
      details.push({ field: `${field}.branchId`, message: "Choose an active branch" });
      return;
    }
    if (!visit.clockIn || !visit.clockOut) {
      details.push({
        field: `${field}.clockIn`,
        message: "Clock in and clock out are required per visit",
      });
    }
  });
  return details;
};

const updateVisitsHandler = (user, reportId, body) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (report.status === "completed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const details = validateVisitBlock(user, body?.visits);
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  const branchesByName = new Map(branches.map((branch) => [branch._id, branch]));
  report.visits = body.visits.map((visit, index) => ({
    visitNo: index + 1,
    branchName: branchesByName.get(visit.branchId).name,
    clockIn: visit.clockIn,
    clockOut: visit.clockOut,
  }));
  report.branches = report.visits.map((visit) => {
    const branch = branches.find((entry) => entry.name === visit.branchName);
    return { branch: branch._id, name: visit.branchName };
  });
  report.branchDigest = null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report), "Visits saved") };
};

const updateVisitHandler = (user, reportId, visitNo, body) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  const index = report.visits.findIndex((visit) => visit.visitNo === Number(visitNo));
  if (index < 0) {
    return error(httpStatus.NOT_FOUND, "Visit not found");
  }
  const details = validateVisitBlock(user, [{ ...body, visitNo: Number(visitNo) }]);
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  const branch = branchOfUser(user, body.branchId);
  const updated = { ...report.visits[index], ...body, visitNo: Number(visitNo), branchName: branch.name };
  report.visits[index] = updated;
  report.branches = report.visits.map((visit) => {
    const entry = branches.find((item) => item.name === visit.branchName);
    return { branch: entry._id, name: visit.branchName };
  });
  report.branchDigest = null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report), "Visit updated") };
};

const removeVisitHandler = (user, reportId, visitNo) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  const index = report.visits.findIndex((visit) => visit.visitNo === Number(visitNo));
  if (index < 0) {
    return error(httpStatus.NOT_FOUND, "Visit not found");
  }
  report.visits.splice(index, 1);
  report.visits = report.visits.map((visit, i) => ({ ...visit, visitNo: i + 1 }));
  report.branches = report.visits.map((visit) => {
    const entry = branches.find((item) => item.name === visit.branchName);
    return entry ? { branch: entry._id, name: visit.branchName } : null;
  }).filter(Boolean);
  report.branchDigest = null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report), "Visit removed") };
};

const acceptReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (report.status !== "reviewed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const unassigned = report.branchDigest?.unassignedItems ?? [];
  if (unassigned.length > 0) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, UNASSIGNED_GATE_MESSAGE);
  }
  report.status = "completed";
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report, true), "Report completed") };
};

const rederiveDigestHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.branchDigest) {
    return error(httpStatus.CONFLICT, "The digest is already up to date");
  }
  if (!report.raw) {
    return error(httpStatus.CONFLICT, "Generate the report content first");
  }
  const { digest } = generateContent(report);
  report.branchDigest = digest;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report, true), "Digest updated") };
};

const generateReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (report.status !== "transcribed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const { raw, latest, digest } = generateContent(report);
  report.raw = raw;
  report.latest = latest;
  report.branchDigest = digest;
  report.status = "reviewed";
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report, true), "Report generated — please review") };
};

const updateContentHandler = (user, reportId, body) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  const content = body?.content ?? "";
  if (typeof content !== "string" || !content.trim()) {
    return error(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Check the highlighted fields",
      [{ field: "content", message: "Content is required" }],
    );
  }
  report.latest = content;
  report.branchDigest = null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report, true), "Content saved") };
};

const correctContentHandler = (user, reportId, body, formData) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  const mode = formData?.get("mode") ?? body?.mode ?? "text";
  const instruction = formData?.get("instruction") ?? body?.instruction ?? "";
  if (!String(instruction).trim()) {
    return error(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Check the highlighted fields",
      [{ field: "instruction", message: "Write a correction instruction" }],
    );
  }
  const reason = /ግስ|ድግግም|ተደጋገመ/i.test(String(instruction))
    ? "removed duplicate verb"
    : "moved case FE paragraph";
  const changed = [
    {
      section: "የተሰሩ ስራዎች",
      field: "content",
      content: `${OFFICIAL_TOKEN_PREFIX} ${String(instruction).split("\n")[0].slice(0, 60)}`,
      reason,
    },
  ];
  return {
    data: successEnvelope(
      { mode: mode === "voice" ? "voice" : "text", changed },
      mode === "voice" ? "Voice correction received" : "Correction staged",
    ),
  };
};

const revertContentHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (!report.raw || report.latest === report.raw) {
    return error(httpStatus.CONFLICT, "There is nothing to revert");
  }
  report.latest = report.raw;
  report.branchDigest = report.branchDigest ? CLONE(report.branchDigest) : null;
  report.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toReportDto(report, true), "Content restored") };
};

const archiveReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  return archiveReportStep(report, user, "Report archived");
};

const restoreReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  return restoreReportStep(report, "Report restored");
};

const deleteReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (!report.isArchived) {
    const result = archiveReportStep(report, user, "Report archived — it will be permanently removed after the retention period");
    if (result.error) {
      return result;
    }
    return { data: successEnvelope({ archived: true }, result.data.message) };
  }
  const doomedClips = clips
    .filter((clip) => clip.report === reportId)
    .map((clip) => clip._id);
  retainWhere(clips, (clip) => clip.report !== reportId);
  retainWhere(
    transcriptions,
    (transcription) => !doomedClips.includes(transcription.audio),
  );
  retainWhere(conversations, (conversation) => conversation.report !== reportId);
  retainWhere(reports, (entry) => entry._id !== reportId);
  return { data: successEnvelope({ deleted: true }, "Report permanently deleted") };
};

const exportContentHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  const stripHtml = String(report.latest ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    data: successEnvelope({
      content: stripHtml,
      reportDate: formatDate(report.reportDate),
      supervisorName: report.supervisorName,
      branchNames: (report.branches ?? []).map((entry) => entry.name),
    }),
  };
};

const listClipsHandler = (user, reportId, visitNo) => {
  if (!reportOwnerOrNull(user, reportId)) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope(clipsOfVisit(reportId, visitNo).map(toClipDto)) };
};

const getAudioHandler = (user, audioId) => {
  const clip = clips.find((entry) => entry._id === audioId && entry.user === user._id);
  if (!clip) {
    return error(httpStatus.NOT_FOUND, AUDIO_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope(toClipDto(clip)) };
};

const uploadClipHandler = (user, reportId, visitNo, body, formData) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (report.status === "completed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const file = formData?.get("clip");
  if (!file || typeof file.name !== "string") {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Choose an audio file to upload");
  }
  if (!AUDIO_ALLOWED_MIME_TYPES.includes(file.type)) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Only audio files are accepted");
  }
  if (file.size > AUDIO_MAX_SIZE_BYTES) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "The audio file is too large (max 50 MB)");
  }
  const clip = {
    _id: `clip-${String(counters.clip++).padStart(4, "0")}`,
    user: user._id,
    report: reportId,
    visitNo: Number(visitNo),
    mimeType: file.type,
    sizeBytes: file.size,
    durationSec: Math.min(90 + (counters.transcription % 10) * 17, AUDIO_MAX_DURATION_SEC),
    transcription: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  counters.transcription += 1;
  clips.push(clip);
  const firstClipEver = clipsOfReport(reportId).length === 1;
  if (firstClipEver && report.status === "draft") {
    report.status = "audio_attached";
    report.updatedAt = new Date().toISOString();
  }
  return { data: successEnvelope(toClipDto(clip), "Clip uploaded") };
};

const deleteClipHandler = (user, audioId) => {
  const index = clips.findIndex((entry) => entry._id === audioId && entry.user === user._id);
  if (index < 0) {
    return error(httpStatus.NOT_FOUND, AUDIO_NOT_FOUND_MESSAGE);
  }
  const clip = clips[index];
  const report = reportOwnerOrNull(user, clip.report);
  clips.splice(index, 1);
  const transcriptionIndex = transcriptions.findIndex((row) => row.audio === audioId);
  if (transcriptionIndex >= 0) {
    transcriptions.splice(transcriptionIndex, 1);
  }
  if (report) {
    const remaining = clipsOfReport(clip.report);
    if (remaining.length === 0 && report.status !== "completed") {
      report.status = report.status === "audio_attached" ? "draft" : "audio_attached";
      report.updatedAt = new Date().toISOString();
    }
  }
  return { data: successEnvelope({ _id: audioId }, "Clip deleted") };
};

const listTranscriptionsHandler = (user, reportId) => {
  if (!reportOwnerOrNull(user, reportId)) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope(transcriptionsOfReport(reportId).map(toTranscriptionDto)) };
};

const transcribeReportHandler = (user, reportId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.isArchived) {
    return error(httpStatus.FORBIDDEN, ARCHIVED_FORBIDDEN_MESSAGE);
  }
  if (report.status === "completed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const reportClips = clipsOfReport(reportId);
  if (reportClips.length === 0) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, NO_AUDIO_MESSAGE);
  }
  const pending = reportClips.filter((clip) => !clip.transcription);
  if (pending.length === 0) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, ALL_TRANSCRIBED_MESSAGE);
  }
  let added = 0;
  for (const clip of pending) {
    const row = {
      _id: `tr-${String(counters.transcription++).padStart(4, "0")}`,
      user: user._id,
      audio: clip._id,
      raw: `± ${OFFICIAL_TOKEN_PREFIX} የቀኑ እንቅስቃሴ ተመልክቷል።`,
      latest: `± ${OFFICIAL_TOKEN_PREFIX} የቀኑ እንቅስቃሴ ተመልክቷል።`,
      language: "am",
      stt: { requestId: `req-${String(counters.transcription)}`, model: "addis-stt-1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    transcriptions.push(row);
    clip.transcription = row._id;
    added += 1;
  }
  const allDone = clipsOfReport(reportId).every((clip) => clip.transcription);
  if (allDone && report.status === "audio_attached") {
    report.status = "transcribed";
    report.updatedAt = new Date().toISOString();
  }
  return {
    data: successEnvelope(
      { completed: added, failed: [] },
      added ? "Transcription ready" : "Nothing to transcribe",
    ),
  };
};

const reTranscribeHandler = (user, reportId, transcriptionId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  if (report.status === "completed") {
    return error(httpStatus.FORBIDDEN, STATUS_FORBIDDEN_MESSAGE);
  }
  const index = transcriptions.findIndex(
    (row) => row._id === transcriptionId && row.user === user._id,
  );
  if (index < 0) {
    return error(httpStatus.NOT_FOUND, TRANSCRIPTION_NOT_FOUND_MESSAGE);
  }
  const replacedText = `± ${OFFICIAL_TOKEN_PREFIX} ዳግም የተገለበጠ የቀኑ ሂደት።`;
  transcriptions[index] = {
    ...transcriptions[index],
    raw: replacedText,
    latest: replacedText,
    stt: {
      requestId: `req-${String(counters.transcription)}`,
      model: "addis-stt-1",
    },
    updatedAt: new Date().toISOString(),
  };
  counters.transcription += 1;
  if (report.status === "reviewed") {
    report.status = "transcribed";
    report.raw = null;
    report.latest = null;
    report.branchDigest = null;
    report.updatedAt = new Date().toISOString();
  }
  return {
    data: successEnvelope(toTranscriptionDto(transcriptions[index]), "Re-transcribed"),
  };
};

const acceptTranscriptionHandler = (user, reportId, transcriptionId) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  const row = transcriptions.find(
    (entry) => entry._id === transcriptionId && entry.user === user._id,
  );
  if (!row) {
    return error(httpStatus.NOT_FOUND, TRANSCRIPTION_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope({ accepted: true, _id: transcriptionId }, "Reviewed") };
};

const getConversationHandler = (user, reportId) => {
  if (!reportOwnerOrNull(user, reportId)) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  const conv = conversations.find(
    (entry) => entry.report === reportId && entry.user === user._id,
  );
  return { data: successEnvelope(toConversationDto(conv) ?? { messages: [] }) };
};

const sendMessageHandler = (user, reportId, body) => {
  const report = reportOwnerOrNull(user, reportId);
  if (!report) {
    return error(httpStatus.NOT_FOUND, REPORT_NOT_FOUND_MESSAGE);
  }
  const content = (body?.content ?? "").trim();
  if (!content) {
    return error(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Check the highlighted fields",
      [{ field: "content", message: "Write a message first" }],
    );
  }
  if (content.length > 4000) {
    return error(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Check the highlighted fields",
      [{ field: "content", message: "The message must be 4000 characters or fewer" }],
    );
  }
  let conv = conversations.find(
    (entry) => entry.report === reportId && entry.user === user._id,
  );
  if (!conv) {
    conv = {
      _id: `conv-${String(counters.conversation++).padStart(4, "0")}`,
      user: user._id,
      report: reportId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.push(conv);
  }
  const now = new Date().toISOString();
  conv.messages.push({
    role: "user",
    content,
    provider: null,
    model: null,
    reasoning: null,
    createdAt: now,
  });
  conv.messages.push({
    role: "assistant",
    content: cannedReply(content),
    provider: "addis",
    model: "Addis-፩-አሌፍ",
    reasoning: null,
    createdAt: new Date(Date.now() + 600).toISOString(),
  });
  conv.updatedAt = now;
  return { data: successEnvelope(toConversationDto(conv), "Message sent") };
};

const getDashboardHandler = (user) => {
  const ownReports = reports.filter((report) => report.user === user._id && !report.isArchived);
  const now = dayjs();
  const eth = gregorianToEthiopian(now.toDate());
  const inEthiopianMonth = (value) => {
    if (!value) {
      return false;
    }
    const part = gregorianToEthiopian(new Date(value));
    return part.month === eth.month && part.year === eth.year;
  };
  const reportsThisMonth = ownReports.filter((report) => inEthiopianMonth(report.reportDate)).length;
  const inProgress = ownReports.filter((report) =>
    ["draft", "audio_attached", "transcribed", "reviewed"].includes(report.status),
  ).length;
  const completed = ownReports.filter((report) => report.status === "completed").length;
  const activeBranches = branches.filter(
    (branch) => branch.user === user._id && !branch.isArchived,
  ).length;
  const statusDistribution = REPORT_STATUSES.map((status) => ({
    status,
    count: ownReports.filter((report) => report.status === status).length,
  }));
  const branchCounts = new Map();
  for (const report of ownReports) {
    for (const entry of report.branches ?? []) {
      branchCounts.set(entry.name, (branchCounts.get(entry.name) ?? 0) + 1);
    }
  }
  const activityByBranch = [...branchCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const issuesTrend = Array.from({ length: 30 }, (_, index) => ({
    date: dayjs()
      .subtract(29 - index, "day")
      .format("DD-MM-YY"),
    count: index % 3 === 0 ? 2 : 1,
  }));
  const kpis = {
    reportsThisMonth,
    inProgress,
    completed,
    activeBranches,
    trends: { reportsThisMonthDelta: 1, completedDelta: 0 },
  };
  return {
    data: successEnvelope(
      { kpis, charts: { statusDistribution, activityByBranch, issuesTrend } },
      "OK",
    ),
  };
};

const getAnalyticsItemsHandler = (user, params) => {
  const { page, limit } = toQuery(params);
  const { branch, group, status, q } = params;
  const rows = [];
  for (const report of reports) {
    if (report.user !== user._id || report.isArchived) {
      continue;
    }
    const digest = report.branchDigest;
    if (!digest) {
      continue;
    }
    const pushItems = (items) => {
      for (const item of items) {
        if (branch && item.branchName !== branch) {
          continue;
        }
        if (group && item.group !== group) {
          continue;
        }
        if (status && item.status !== status) {
          continue;
        }
        if (q && !item.text.includes(q)) {
          continue;
        }
        rows.push({ ...item, reportId: report._id, reportDate: report.reportDate });
      }
    };
    for (const branchEntry of digest.branches) {
      const base = { branchName: branchEntry.branchName };
      pushItems(branchEntry.activities.map((item) => ({ ...item, ...base, group: "activities" })));
      pushItems(branchEntry.issues.map((item) => ({ ...item, ...base, group: "issues" })));
    }
    pushItems(
      digest.unassignedItems.map((item) => ({ ...item, branchName: null, group: "unassigned" })),
    );
  }
  return { data: successEnvelope(paginate(rows, page, limit)) };
};

const searchHandler = (user, params) => {
  const { page, limit } = toQuery(params);
  const { q, type, includeArchived } = params ?? {};
  const query = String(q ?? "").trim().toLowerCase();
  if (!query) {
    return error(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Check the highlighted fields",
      [{ field: "q", message: "Type a search query" }],
    );
  }
  const docs = [];
  if (!type || type === "report") {
    for (const report of reports) {
      if (report.user !== user._id) {
        continue;
      }
      if (report.isArchived && includeArchived !== "true") {
        continue;
      }
      const haystack = [
        report.supervisorName,
        ...(report.branches ?? []).map((entry) => entry.name),
        ...(report.visits ?? []).map((visit) => visit.branchName),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        continue;
      }
      const matchedFields = ["supervisorName", "branches.name"]
        .filter((field) => {
          const value =
            field === "supervisorName" ? report.supervisorName : (report.branches ?? []).map((entry) => entry.name).join(" ");
          return value.toLowerCase().includes(query);
        });
      docs.push({
        type: "report",
        entityId: report._id,
        title: formatDate(report.reportDate) ?? "New report",
        subtitle: report.supervisorName,
        status: report.status,
        matchedFields,
      });
    }
  }
  if (!type || type === "branch") {
    for (const branch of branches) {
      if (branch.user !== user._id) {
        continue;
      }
      if (branch.isArchived && includeArchived !== "true") {
        continue;
      }
      const haystack = `${branch.name} ${branch.location}`.toLowerCase();
      if (!haystack.includes(query)) {
        continue;
      }
      docs.push({
        type: "branch",
        entityId: branch._id,
        title: branch.name,
        subtitle: branch.location,
        status: undefined,
        matchedFields: branch.name.toLowerCase().includes(query) ? ["name"] : ["location"],
      });
    }
  }
  docs.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "branch" ? 1 : -1;
    }
    return compareDesc(a.title, b.title);
  });
  return { data: successEnvelope(paginate(docs, page, limit)) };
};

const listBranchesHandler = (user, params) => {
  const { page, limit } = toQuery(params);
  let rows = perUser(user, branches);
  if (params.isArchived === "true") {
    rows = rows.filter((branch) => branch.isArchived);
  } else {
    rows = rows.filter((branch) => !branch.isArchived);
  }
  rows = rows.sort((a, b) => compareDesc(b.createdAt, a.createdAt));
  return { data: successEnvelope(paginate(rows.map(toBranchDto), page, limit)) };
};

const getBranchHandler = (user, branchId) => {
  const branch = branches.find((entry) => entry._id === branchId && entry.user === user._id);
  if (!branch) {
    return error(httpStatus.NOT_FOUND, BRANCH_NOT_FOUND_MESSAGE);
  }
  return { data: successEnvelope(toBranchDto(branch)) };
};

const createBranchHandler = (user, body) => {
  const details = [];
  const name = (body?.name ?? "").trim();
  const location = (body?.location ?? "").trim();
  if (!name || name.length > 100) {
    details.push({ field: "name", message: "Enter a name up to 100 characters" });
  }
  if (!location || location.length > 200) {
    details.push({ field: "location", message: "Enter a location up to 200 characters" });
  }
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  const branch = {
    _id: `branch-${String(counters.session).padStart(4, "0")}`,
    user: user._id,
    name,
    location,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  counters.session += 1;
  branches.push(branch);
  return { data: successEnvelope(toBranchDto(branch), "Branch created") };
};

const updateBranchHandler = (user, branchId, body) => {
  const branch = branches.find((entry) => entry._id === branchId && entry.user === user._id);
  if (!branch) {
    return error(httpStatus.NOT_FOUND, BRANCH_NOT_FOUND_MESSAGE);
  }
  const details = [];
  if (body?.name !== undefined && (!String(body.name).trim() || String(body.name).trim().length > 100)) {
    details.push({ field: "name", message: "Enter a name up to 100 characters" });
  }
  if (body?.location !== undefined && (!String(body.location).trim() || String(body.location).trim().length > 200)) {
    details.push({ field: "location", message: "Enter a location up to 200 characters" });
  }
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  if (body?.name !== undefined) {
    branch.name = String(body.name).trim();
  }
  if (body?.location !== undefined) {
    branch.location = String(body.location).trim();
  }
  branch.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toBranchDto(branch), "Branch updated") };
};

const archiveBranchHandler = (user, branchId) => {
  const branch = branches.find((entry) => entry._id === branchId && entry.user === user._id);
  if (!branch) {
    return error(httpStatus.NOT_FOUND, BRANCH_NOT_FOUND_MESSAGE);
  }
  if (branch.isArchived) {
    return error(httpStatus.CONFLICT, "This branch is already archived");
  }
  branch.isArchived = true;
  branch.archivedAt = new Date().toISOString();
  branch.updatedAt = branch.archivedAt;
  return { data: successEnvelope(toBranchDto(branch), "Branch archived — reports keep their data") };
};

const restoreBranchHandler = (user, branchId) => {
  const branch = branches.find((entry) => entry._id === branchId && entry.user === user._id);
  if (!branch) {
    return error(httpStatus.NOT_FOUND, BRANCH_NOT_FOUND_MESSAGE);
  }
  if (!branch.isArchived) {
    return error(httpStatus.CONFLICT, "This branch is not archived");
  }
  branch.isArchived = false;
  branch.archivedAt = null;
  branch.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toBranchDto(branch), "Branch restored") };
};

const deleteBranchHandler = (user, branchId) => {
  const branch = branches.find((entry) => entry._id === branchId && entry.user === user._id);
  if (!branch) {
    return error(httpStatus.NOT_FOUND, BRANCH_NOT_FOUND_MESSAGE);
  }
  if (!branch.isArchived) {
    branch.isArchived = true;
    branch.archivedAt = new Date().toISOString();
    branch.updatedAt = branch.archivedAt;
    return {
      data: successEnvelope(
        { archived: true },
        "Branch archived — it will be permanently removed after the retention period",
      ),
    };
  }
  return error(httpStatus.CONFLICT, "This branch is already archived");
};

const updateProfileHandler = (user, body, formData) => {
  const entries = formData ? Object.fromEntries(formData.entries()) : body ?? {};
  const details = [];
  const position = String(entries.position ?? user.position ?? "").trim();
  if (position.length > 200) {
    details.push({ field: "position", message: "Position must be 200 characters or fewer" });
  }
  if (entries.firstName !== undefined) {
    const firstName = String(entries.firstName).trim();
    if (!firstName || firstName.length > 100) {
      details.push({ field: "firstName", message: "Enter a first name up to 100 characters" });
    }
  }
  if (details.length) {
    return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
  }
  const avatarFile = entries.avatar;
  if (avatarFile && typeof avatarFile.name === "string") {
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(avatarFile.type)) {
      return error(
        httpStatus.UNPROCESSABLE_ENTITY,
        "Check the highlighted fields",
        [{ field: "avatar", message: "Use a JPEG, PNG or WebP image" }],
      );
    }
    if (avatarFile.size > AVATAR_MAX_SIZE_BYTES) {
      return error(
        httpStatus.UNPROCESSABLE_ENTITY,
        "Check the highlighted fields",
        [{ field: "avatar", message: "The image must be 5 MB or smaller" }],
      );
    }
    user.avatar = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%23hsl(210,98%,48%)'/%3E%3Ctext x='24' y='31' font-size='22' text-anchor='middle' fill='white'%3E" +
      encodeURIComponent(user.fullName.charAt(0)) +
      "%3C/text%3E%3C/svg%3E".replace("%23hsl(210,98%,48%)", "037af2");
  }
  if (entries.firstName !== undefined) {
    user.firstName = String(entries.firstName).trim();
    user.fullName = `${user.firstName} ${user.lastName}`.trim();
  }
  user.position = position;
  user.updatedAt = new Date().toISOString();
  return { data: successEnvelope(toUserDto(user), "Profile updated") };
};

const listSessionsHandler = (user) => {
  const rows = sessions
    .filter((session) => session.user === user._id)
    .map((session) => ({
      _id: session._id,
      device: session.device,
      issuedAt: session.issuedAt,
      lastUsedAt: session.lastUsedAt,
      isCurrent: activeSession?._id === session._id,
    }));
  return { data: successEnvelope(rows) };
};

const deleteSessionHandler = (user, sessionId) => {
  const index = sessions.findIndex(
    (session) => session._id === sessionId && session.user === user._id,
  );
  if (index < 0) {
    return error(httpStatus.NOT_FOUND, SESSION_NOT_FOUND_MESSAGE);
  }
  if (activeSession?._id === sessions[index]._id) {
    return error(httpStatus.CONFLICT, "End the current session from the header instead");
  }
  sessions.splice(index, 1);
  return { data: successEnvelope({ _id: sessionId }, "Session ended") };
};

/* ------------------------------------------------------------------ */
/* Auth handlers (P3 surface, unchanged behaviour)                     */
/* ------------------------------------------------------------------ */

const authHandlers = {
  "POST /auth/register": (body) => {
    const { email, password } = body;
    const details = [];
    if (!email || !EMAIL_REGEX.test(email)) {
      details.push({ field: "email", message: "Enter a valid email address" });
    }
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      details.push({ field: "password", message: "Password must be at least 8 characters" });
    }
    if (details.length) {
      return error(httpStatus.UNPROCESSABLE_ENTITY, "Check the highlighted fields", details);
    }
    if (findUser(email)) {
      return error(httpStatus.CONFLICT, EMAIL_TAKEN_MESSAGE);
    }
    const { firstName, lastName } = deriveName(email);
    const user = {
      _id: `mock-${String(users.length + 1).padStart(4, "0")}`,
      email,
      password,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      avatar: "",
      position: "Supervisor",
    };
    users.push(user);
    return { data: successEnvelope({ user: toUserDto(user) }, "Account created") };
  },

  "POST /auth/login": (body) => {
    const { email, password } = body;
    const user = findUser(email ?? "");
    if (!user || user.password !== password) {
      return error(httpStatus.UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
    }
    startSessionForUser(user);
    return { data: successEnvelope({ user: toUserDto(user) }, "Logged in") };
  },

  "POST /auth/refresh": () => {
    if (!activeSession || Date.now() > activeSession.refresh.expiresAt) {
      return error(httpStatus.UNAUTHORIZED, SESSION_EXPIRED_MESSAGE);
    }
    const user = users.find((entry) => entry._id === activeSession.userId);
    if (!user) {
      return error(httpStatus.UNAUTHORIZED, SESSION_EXPIRED_MESSAGE);
    }
    startSessionForUser(user);
    return { data: successEnvelope({ user: toUserDto(user) }, "Session refreshed") };
  },

  "POST /auth/logout": () => {
    activeSession = null;
    persistSession(null);
    return { data: successEnvelope(null, "Logged out") };
  },

  "GET /auth/me": () => {
    const user = sessionUser();
    if (!user) {
      return error(httpStatus.UNAUTHORIZED, SESSION_EXPIRED_MESSAGE);
    }
    return { data: successEnvelope({ user: toUserDto(user) }, "OK") };
  },

  "GET /auth/google": () => {
    return error(httpStatus.NOT_FOUND, GOOGLE_STUB_MESSAGE);
  },
};

/* ------------------------------------------------------------------ */
/* Dispatch                                                             */
/* ------------------------------------------------------------------ */

const paths = [
  { re: /^\/reports$/, method: "GET", fn: listReportsHandler, arity: 2 },
  { re: /^\/reports\/export\/content\/(.+)$/, method: "GET", fn: null }, // never used; guard below
  { re: /^\/reports\/([^/]+)\/export\/content$/, method: "GET", fn: exportContentHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/transcriptions\/([^/]+)\/re-transcribe$/, method: "POST", fn: reTranscribeHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/transcriptions\/([^/]+)\/accept$/, method: "POST", fn: acceptTranscriptionHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/transcriptions$/, method: "GET", fn: listTranscriptionsHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/transcribe$/, method: "POST", fn: transcribeReportHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/visits\/([^/]+)\/clips$/, method: "GET", fn: listClipsHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/visits\/([^/]+)\/clips$/, method: "POST", fn: uploadClipHandler, arity: 4 },
  { re: /^\/reports\/([^/]+)\/visits\/([^/]+)$/, method: "PUT", fn: updateVisitHandler, arity: 4 },
  { re: /^\/reports\/([^/]+)\/visits\/([^/]+)$/, method: "DELETE", fn: removeVisitHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/visits$/, method: "PATCH", fn: updateVisitsHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/chat\/messages$/, method: "POST", fn: sendMessageHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/chat$/, method: "GET", fn: getConversationHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/content\/revert$/, method: "POST", fn: revertContentHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/content$/, method: "PATCH", fn: updateContentHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)\/correct$/, method: "POST", fn: correctContentHandler, arity: 4 },
  { re: /^\/reports\/([^/]+)\/accept$/, method: "POST", fn: acceptReportHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/digest$/, method: "POST", fn: rederiveDigestHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/generate$/, method: "POST", fn: generateReportHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/archive$/, method: "POST", fn: archiveReportHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)\/restore$/, method: "POST", fn: restoreReportHandler, arity: 2 },
  { re: /^\/reports\/([^/]+)$/, method: "GET", fn: getReportHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)$/, method: "PATCH", fn: updateReportHandler, arity: 3 },
  { re: /^\/reports\/([^/]+)$/, method: "DELETE", fn: deleteReportHandler, arity: 2 },
  { re: /^\/reports$/, method: "POST", fn: createReportHandler, arity: 2 },
  { re: /^\/audios\/([^/]+)$/, method: "GET", fn: getAudioHandler, arity: 2 },
  { re: /^\/audios\/([^/]+)$/, method: "DELETE", fn: deleteClipHandler, arity: 2 },
  { re: /^\/branches\/([^/]+)\/archive$/, method: "POST", fn: archiveBranchHandler, arity: 2 },
  { re: /^\/branches\/([^/]+)\/restore$/, method: "POST", fn: restoreBranchHandler, arity: 2 },
  { re: /^\/branches\/([^/]+)$/, method: "GET", fn: getBranchHandler, arity: 2 },
  { re: /^\/branches\/([^/]+)$/, method: "PATCH", fn: updateBranchHandler, arity: 3 },
  { re: /^\/branches\/([^/]+)$/, method: "DELETE", fn: deleteBranchHandler, arity: 2 },
  { re: /^\/branches$/, method: "GET", fn: listBranchesHandler, arity: 2 },
  { re: /^\/branches$/, method: "POST", fn: createBranchHandler, arity: 2 },
  { re: /^\/analytics\/dashboard$/, method: "GET", fn: getDashboardHandler, arity: 1 },
  { re: /^\/analytics\/items$/, method: "GET", fn: getAnalyticsItemsHandler, arity: 2 },
  { re: /^\/search$/, method: "GET", fn: searchHandler, arity: 2 },
  { re: /^\/auth\/sessions\/([^/]+)$/, method: "DELETE", fn: deleteSessionHandler, arity: 2 },
  { re: /^\/auth\/sessions$/, method: "GET", fn: listSessionsHandler, arity: 1 },
  { re: /^\/auth\/profile$/, method: "PATCH", fn: updateProfileHandler, arity: 3 },
];

const pathHandler = (method, url) => {
  const entry = paths.find((item) => item.method === method && item.re !== null && item.re.test(url));
  if (!entry) {
    return null;
  }
  const params = url.match(entry.re).slice(1).map(decodeURIComponent);
  return { entry, params };
};

/**
 * The mock transport — fetchBaseQuery-shaped: resolves to
 * `{ data: envelope }` on success or `{ error: { status, data:
 * envelope } }` on failure. Args carry `url` (relative to the
 * configured base), `method`, `body` (JSON object or `FormData` for
 * multipart routes) and `params` (query-object) — mirroring the real
 * transport's result surface so the §42.3 chain and §42.4
 * normalization run unchanged.
 *
 * @param {{url?: string, method?: string, body?: Object|FormData, params?: Object}} args - Request args.
 * @returns {Promise<{data?: Object}|{error?: {status: number, data: Object}}>} Result.
 */
export const mockTransport = async (args) => {
  await delay();
  const seeded = seededFailure();
  if (seeded) {
    return seeded;
  }
  const method = (args.method ?? "GET").toUpperCase();
  const url = args.url ?? "";
  const formData = args.body instanceof FormData ? args.body : null;
  const body = formData ? null : (args.body ?? {});

  const authRoute = authHandlers[`${method} ${url}`];
  if (authRoute) {
    return authRoute(body);
  }

  const matched = pathHandler(method, url);
  if (!matched) {
    return error(httpStatus.NOT_FOUND, TT_MESSAGE);
  }
  const { entry, params } = matched;
  const userGate = requireUser();
  if (userGate.stop) {
    return userGate.value;
  }
  const user = userGate.value;
  const argsFor = [user];
  for (let index = 0; index < entry.fn.length - 1; index += 1) {
    if (index < params.length) {
      argsFor.push(params[index]);
    } else if (index === params.length && args.body != null) {
      argsFor.push(body);
    } else if (index === params.length + (args.body != null ? 1 : 0) && formData) {
      argsFor.push(formData);
    } else {
      argsFor.push(args.params ?? {});
    }
  }
  return entry.fn(...argsFor);
};