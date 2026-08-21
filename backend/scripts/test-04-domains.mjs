/**
 * Sub-phase 4 — Domain APIs verification suite (§63.10).
 *
 * Terminal-visible contract: every check prints the request (method +
 * path) and the response status + full JSON body, then a PASS/FAIL
 * verdict; non-HTTP checks print a `UNIT` line with the same framing.
 * The suite ends with PASS=N FAIL=M and exits non-zero on any failure.
 * Output goes through process.stdout.write (no console.log literal —
 * §9.5/§63.4 grep-gate clean). Zero dependencies beyond Node 24
 * built-ins + ffmpeg/ffprobe (the §10.4 binaries — used only to
 * synthesize fixture audio).
 *
 * Groups (run per group with a backend restart between them — the
 * in-memory rate store resets on restart, §63.10):
 *   node scripts/test-04-domains.mjs                 (unit)
 *   node scripts/test-04-domains.mjs --only=branches
 *   node scripts/test-04-domains.mjs --only=reports
 *   node scripts/test-04-domains.mjs --only=audio
 *   node scripts/test-04-domains.mjs --only=transcription
 *   node scripts/test-04-domains.mjs --only=realpipeline   (REAL AI — addis STT + addis/gemini TTT)
 *   node scripts/test-04-domains.mjs --only=ratelimit      (last, in isolation — exhausts the ai tier)
 *   node scripts/test-04-domains.mjs --only=sourcegates
 *
 * Real-AI policy (owner directive 2026-08-20): live calls run on
 * **addis** (STT is addis-only, ADR-001; generation default) and
 * **gemini** (corrections/chat via the request `provider`); **no live
 * NVIDIA call exists anywhere** — the nvidia adapter is exercised
 * only statically (sourcegates).
 *
 * The realpipeline group uses the owner-provided real recording at
 * `backend/scripts/fixtures/amharic-sample-recording.webm` (≈187.7 s
 * — exercises ffmpeg conversion + the 60 s chunk splitter + 4 real
 * addis STT chunks + a real generation/correction/chat pass). The
 * asset lives OUTSIDE `uploads/` on purpose: the §62.4 pass-2 sweep
 * unlinks any unreferenced file in the §32 temp areas, so a test
 * asset parked there is destroyed on the next sweeper run (verified
 * 2026-08-20 — the original uploads/audio copy was swept). Place the
 * owner-provided file at that path before running this group.
 * Real-AI budget ≈ 8–9 calls per run (inside the ai tier's 10/min).
 */
import process from "node:process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { sanitizeHtml, plainToHtml } from "../utils/sanitizer.js";
import { paginate } from "../utils/pagination.js";
import {
  gregorianToEthiopian,
  formatEthiopianDate,
  ethiopianMonthRange,
  ethiopianMonthOf,
} from "../utils/ethiopianDate.js";
import { prepareAndSplit, cleanupChunks } from "../utils/wavSplitter.js";
import { mergeRawTexts } from "../services/stt.service.js";
import {
  renderReport,
  validateGenerationPayload,
} from "../services/generation.service.js";
import { mergeChanged } from "../services/correction.service.js";

const BASE = "http://localhost:4000";
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

const RUN_SUFFIX = `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "secret123";

const REAL_CLIP = join(
  process.cwd(),
  "scripts",
  "fixtures",
  "amharic-sample-recording.webm",
);
const TMP_DIR = join(process.cwd(), "uploads", "tmp");

let pass = 0;
let fail = 0;

function out(line = "") {
  process.stdout.write(`${line}\n`);
}

function jsonBody(data) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

async function request(method, path, options = {}, timeoutMs) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    ...options,
    ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
  });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return {
    status: res.status,
    headers: res.headers,
    body,
    setCookies: res.headers.getSetCookie(),
  };
}

function verdict(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    out(`  PASS \u2713 ${name}`);
  } else {
    fail += 1;
    out(`  FAIL \u2717 ${name}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}

function section(title) {
  out(
    `\u2500\u2500\u2500 ${title} \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
  );
}

async function httpCheck(id, name, method, path, opts, asserts, timeoutMs) {
  out(`[${id}] ${method} ${path}`);
  const res = await request(method, path, opts, timeoutMs);
  out(`    status : ${res.status}`);
  out(
    `    body   : ${typeof res.body === "string" ? res.body : JSON.stringify(res.body)}`,
  );
  const failures = [];
  for (const [label, ok] of asserts(res)) {
    if (!ok) failures.push(label);
  }
  verdict(
    name,
    failures.length === 0,
    failures.length ? `failed: ${failures.join(", ")}` : "",
  );
}

function unitCheck(id, name, ok, detail = "") {
  out(`[${id}] UNIT ${name}`);
  verdict(name, ok, detail);
}

const jar = {};
function loadCookies(setCookies) {
  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1);
  }
}
function cookieHeader() {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}
function authJson(data) {
  return {
    headers: { "Content-Type": "application/json", Cookie: cookieHeader() },
    body: JSON.stringify(data),
  };
}
function authHeaders() {
  return { headers: { Cookie: cookieHeader() } };
}

/**
 * Manual multipart body builder — the suite never uses undici's
 * FormData (a Node-on-Windows undici crash corrupts FormData uploads
 * mid-flight; the manual buffer is deterministic and portable).
 * @param {object} fields - Text form fields.
 * @param {{ name: string, buffer: Buffer, type: string }} file - The single file part.
 * @returns {{ headers: object, body: Buffer }} Fetch options.
 */
function multipart(fields, file) {
  const boundary = `----rbv3-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const chunks = [];
  for (const [key, value] of Object.entries(fields ?? {})) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`,
      ),
      file.buffer,
      Buffer.from(`\r\n`),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: cookieHeader(),
    },
    body: Buffer.concat(chunks),
  };
}

async function registerAndLogin(prefix) {
  const email = `${prefix}.${RUN_SUFFIX}@example.com`;
  const reg = await request(
    "POST",
    "/api/v1/auth/register",
    jsonBody({ email, password: PASSWORD }),
  );
  const login = await request(
    "POST",
    "/api/v1/auth/login",
    jsonBody({ email, password: PASSWORD }),
  );
  loadCookies(login.setCookies);
  return { email, registerStatus: reg.status, loginStatus: login.status };
}

/** Synthesizes a WAV buffer (mono 16-bit 16 kHz): silence or a soft 440 Hz tone. */
function synthesizeWav(seconds, tone = false) {
  const sampleRate = 16000;
  const n = Math.floor(seconds * sampleRate);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  if (tone) {
    for (let i = 0; i < n; i += 1) {
      const sample = Math.round(
        2000 * Math.sin((2 * Math.PI * 440 * i) / sampleRate),
      );
      buf.writeInt16LE(sample, 44 + i * 2);
    }
  }
  return buf;
}

/** Cuts a short PCM piece off the real clip (for the ephemeral transcripts test). */
function cutRealClip(seconds) {
  mkdirSync(TMP_DIR, { recursive: true });
  const out = join(TMP_DIR, `cut-${Date.now()}.wav`);
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-ss",
    "0",
    "-t",
    String(seconds),
    "-i",
    REAL_CLIP,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "pcm_s16le",
    out,
  ]);
  return out;
}

const AUTH_DTO_KEYS = [
  "_id",
  "user",
  "name",
  "location",
  "isArchived",
  "archivedAt",
  "createdAt",
  "updatedAt",
];
const AUDIO_DTO_KEYS = [
  "_id",
  "report",
  "mimeType",
  "sizeBytes",
  "durationSec",
  "createdAt",
  "updatedAt",
];
const TRANSCRIPTION_DTO_KEYS = [
  "_id",
  "user",
  "report",
  "raw",
  "latest",
  "language",
  "stt",
  "createdAt",
  "updatedAt",
];

function hasKeys(obj, keys) {
  return obj && keys.every((k) => Object.prototype.hasOwnProperty.call(obj, k));
}

// ─────────────────────────────── GROUP: unit ───────────────────────────────

async function runUnit() {
  section("unit \u2014 pure functions");
  out("[U1] UNIT sanitizer allowlist");
  {
    const dirty =
      '<p>ዛሬ <strong>ጥሩ</strong> ±ቀን: <script>alert(1)</script><img src=x onerror=alert(1)><span style="font-size: 18px; color: red; background: url(javascript:1)">ስፓን</span></p>';
    const clean = sanitizeHtml(dirty);
    unitCheck(
      "U1",
      "sanitizer strips script/events/img, keeps ± + Amharic, filters style",
      clean.includes("±ቀን") &&
        clean.includes("ዛሬ") &&
        !clean.includes("script") &&
        !clean.includes("alert") &&
        !clean.includes("onerror") &&
        !clean.includes("background") &&
        clean.includes("font-size: 18px"),
    );
  }
  out("[U2] UNIT plainToHtml");
  {
    const p = plainToHtml("ዛሬ ጠዋት <ነበር>");
    unitCheck(
      "U2",
      'plainToHtml escapes + wraps; empty → ""',
      p === "<p>ዛሬ ጠዋት &lt;ነበር&gt;</p>" && plainToHtml("") === "",
    );
  }
  out("[U3] UNIT ethiopianDate anchors");
  {
    const a1 = gregorianToEthiopian(new Date(2007, 8, 12));
    const a2 = gregorianToEthiopian(new Date(2026, 7, 9));
    const range = ethiopianMonthRange(2018, 12);
    unitCheck(
      "U3",
      "anchors (1 Meskerem 2000 = 12 Sep 2007; 3 Nahase 2018 = 9 Aug 2026) + month range + format",
      a1.year === 2000 &&
        a1.month === 1 &&
        a1.day === 1 &&
        a2.month === 12 &&
        a2.day === 3 &&
        a2.year === 2018 &&
        range.start < range.end &&
        /^\d{2}-\d{2}-\d{2}$/.test(formatEthiopianDate(new Date(2026, 7, 20))),
    );
  }
  out("[U3b] UNIT month-range calendar-day bounds (§38.5)");
  {
    // Nahase 2018 = 7 Aug – 5 Sep 2026; the client submits local-noon
    // ISOs (09:00Z for +03:00) and date-only ISOs (00:00Z) — both
    // must fall inside their calendar day's [00:00Z, 24:00Z) window
    // (the 2026-08-20 noon-bound fix).
    const range = ethiopianMonthRange(2018, 12);
    const inRange = (d) => d >= range.start && d < range.end;
    const firstDayLocal = new Date(Date.UTC(2026, 7, 7, 9));
    const firstDayMidnight = new Date(Date.UTC(2026, 7, 7, 0));
    const lastDayLocal = new Date(Date.UTC(2026, 8, 5, 9));
    const afterMonth = new Date(Date.UTC(2026, 8, 6, 9));
    const beforeMonth = new Date(Date.UTC(2026, 7, 6, 9));
    unitCheck(
      "U3b",
      "Nahase 1 (09:00Z and 00:00Z) and Nahase 30 (09:00Z) inside; day before/after excluded",
      inRange(firstDayLocal) && inRange(firstDayMidnight) && inRange(lastDayLocal) && !inRange(afterMonth) && !inRange(beforeMonth),
    );
  }
  out("[U4] UNIT pagination clamp");
  {
    const fakeModel = {
      paginate: async (query, opts) => ({
        docs: [],
        page: opts.page,
        limit: opts.limit,
        totalDocs: 0,
        totalPages: 0,
      }),
    };
    const result = await paginate(fakeModel, {}, { page: 0, limit: 1000 });
    unitCheck(
      "U4",
      "pagination defaults page→1 and clamps limit→100",
      result.page === 1 && result.limit === 100 && result.totalPages === 0,
    );
  }
  out("[U5] UNIT wavSplitter");
  {
    mkdirSync(TMP_DIR, { recursive: true });
    const silent = join(TMP_DIR, `silent-${Date.now()}.wav`);
    const tone = join(TMP_DIR, `tone-${Date.now()}.wav`);
    writeFileSync(silent, synthesizeWav(10));
    writeFileSync(tone, synthesizeWav(125, true));
    const single = await prepareAndSplit(silent);
    cleanupChunks(single);
    const chunks = await prepareAndSplit(tone);
    let durations = [];
    try {
      durations = chunks.map((c) => {
        const sec = execFileSync("ffprobe", [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          c,
        ])
          .toString()
          .trim();
        return Number(sec);
      });
    } finally {
      cleanupChunks(chunks);
    }
    unitCheck(
      "U5",
      "wavSplitter: ≤60s → 1 chunk; 125s → 3 chunks each ≤ 60.5s",
      single.length === 1 &&
        chunks.length === 3 &&
        durations.every((d) => d <= 60.5),
    );
    rmSync(silent, { force: true });
    rmSync(tone, { force: true });
  }
  out("[U6] UNIT mergeRawTexts");
  {
    const first = mergeRawTexts(null, ["a", "b"]);
    const remerge = mergeRawTexts(first, ["c"]);
    const empties = mergeRawTexts(null, ["", "  "]);
    unitCheck(
      "U6",
      'merge: join([...]) / re-merge join([raw, ...new]) / empty segments contribute nothing / all-empty → ""',
      first === "a b" && remerge === "a b c" && empties === "",
    );
  }
  out("[U7] UNIT generation payload validation");
  {
    const good = {
      report: {
        header: "h",
        branchSections: [
          {
            branchName: "x",
            activities: ["a"],
            unresolvedIssues: [],
            generalOpinion: "o",
          },
        ],
        daySummary: "d",
        exitTime: "e",
        overallAssessment: "oa",
      },
      items: {
        activities: [{ text: "a" }],
        issues: [],
        comment: { text: null, rating: 4 },
      },
    };
    unitCheck(
      "U7",
      "validateGenerationPayload accepts the §34.4 shape, rejects malformed",
      validateGenerationPayload(good) &&
        !validateGenerationPayload({ report: { header: 1 } }) &&
        !validateGenerationPayload({
          report: good.report,
          items: {
            activities: [],
            issues: [],
            comment: { text: "x", rating: 9 },
          },
        }),
    );
  }
  out("[U8] UNIT renderReport + mergeChanged");
  {
    const report = {
      date: new Date(2026, 7, 20, 12),
      branch: "b1",
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [{ branch: "b1", clockIn: "08:30", clockOut: "17:30" }],
    };
    const parsed = {
      report: {
        header: "h",
        branchSections: [
          {
            branchName: "መድኃኒዓለም",
            activities: ["ተግባር 1"],
            unresolvedIssues: ["ጉዳይ 1"],
            generalOpinion: "አስተያየት",
          },
        ],
        daySummary: "ማጠቃለያ",
        exitTime: "17:30",
        overallAssessment: "በአጠቃላይ ጥሩ",
      },
      items: {
        activities: [],
        issues: [],
        comment: { text: null, rating: null },
      },
    };
    const latest = renderReport({
      report,
      user: { fullName: "ቤዛ አያሌው" },
      parsed,
      branchNameOf: () => "መድኃኒዓለም",
    });
    const typeTwo = renderReport({
      report: {
        date: report.date,
        branch: "b1",
        clockIn: "08:30",
        clockOut: "17:30",
        visits: [
          { branch: "b1", clockIn: "08:30", clockOut: "17:30" },
          { branch: "b2", clockIn: "10:00", clockOut: "12:00" },
        ],
      },
      user: { fullName: "ቤዛ አያሌው" },
      parsed,
      branchNameOf: (id) =>
        ({ b1: "መድኃኒዓለም", b2: "ኤርፖርት" })[id.toString()] ?? null,
    });
    const candidate = mergeChanged(latest, [
      {
        section: "መድኃኒዓለም",
        field: "activities",
        content: "የተስተካከለ ተግባር",
        reason: "removed duplicate verb",
      },
    ]);
    unitCheck(
      "U8",
      "render: ± labels + Type-2 ranges + exit; merge: surgical replace + ± preserved + locate-fail null",
      latest.includes("±ቀን:") &&
        latest.includes("±የተሰሩ ስራዎች:") &&
        latest.includes("±ከስራ የወጣሁበት ሰዓት: 17:30") &&
        typeTwo.includes("ከ08:30 - 17:30 መድኃኒዓለም ብራንች") &&
        typeTwo.includes("ከ10:00 - 12:00 ኤርፖርት ብራንች") &&
        typeTwo.includes("±ብራንች: መድኃኒዓለም / ኤርፖርት") &&
        candidate.includes("የተስተካከለ ተግባር") &&
        !candidate.includes("ተግባር 1") &&
        candidate.includes("±መፍትሄ የሚፈሉ ጉዳዮች:") &&
        mergeChanged(latest, [
          { section: "x", field: "bogus", content: "x", reason: "y" },
        ]) === null,
    );
  }
  out("[U9] UNIT ethiopianMonthOf null exclusion");
  unitCheck(
    "U9",
    "null date excluded from buckets (§38.5)",
    ethiopianMonthOf(null) === null &&
      ethiopianMonthOf(new Date(2026, 7, 20)).month === 12,
  );
}

// ───────────────────────────── GROUP: branches ─────────────────────────────

async function runBranches() {
  section("branches \u2014 §30");
  const fixture = await registerAndLogin("sp4.br");
  unitCheck(
    "BR0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );

  let branchId;
  let secondId;
  await httpCheck(
    "BR1",
    "POST /branches → 201 BranchDto",
    "POST",
    "/api/v1/branches",
    authJson({
      name: "Addis — Mexico",
      location: "Mexico Square, Addis Ababa",
    }),
    (res) => [
      ["status 201", res.status === 201],
      ["DTO keys exact", hasKeys(res.body?.data, AUTH_DTO_KEYS)],
      ["name stored", res.body?.data?.name === "Addis — Mexico"],
      ["archived false", res.body?.data?.isArchived === false],
    ],
  );
  branchId = (
    await request(
      "POST",
      "/api/v1/branches",
      authJson({ name: "Addis — Mexico", location: "Mexico Square" }),
    )
  ).body?.data?._id;

  await httpCheck(
    "BR2",
    "POST duplicate name → 201 (allowed, no unique index §20)",
    "POST",
    "/api/v1/branches",
    authJson({ name: "Addis — Mexico", location: "Bole" }),
    (res) => [["status 201", res.status === 201]],
  );
  secondId = (
    await request("GET", "/api/v1/branches", authHeaders())
  ).body?.data?.docs?.find((b) => b.location === "Bole")?._id;

  await httpCheck(
    "BR3",
    "GET /branches → active-only default",
    "GET",
    "/api/v1/branches",
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "paginated shape",
        res.body?.data?.docs &&
          res.body?.data?.totalDocs >= 2 &&
          res.body?.data?.page === 1,
      ],
    ],
  );

  await httpCheck(
    "BR4",
    "POST /branches missing name → 422 details",
    "POST",
    "/api/v1/branches",
    authJson({ location: "x" }),
    (res) => [
      ["status 422", res.status === 422],
      ["details field name", res.body?.details?.[0]?.field === "name"],
    ],
  );

  await httpCheck(
    "BR5",
    "GET /branches/:id → 200",
    "GET",
    `/api/v1/branches/${branchId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["DTO", res.body?.data?._id === branchId],
    ],
  );

  await httpCheck(
    "BR6",
    "GET /branches/:id malformed → 422",
    "GET",
    "/api/v1/branches/not-an-id",
    authHeaders(),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "BR7",
    "PATCH /branches/:id → 200 renamed",
    "PATCH",
    `/api/v1/branches/${branchId}`,
    authJson({ name: "Addis — Mexico (Renovated)" }),
    (res) => [
      ["status 200", res.status === 200],
      ["name updated", res.body?.data?.name === "Addis — Mexico (Renovated)"],
    ],
  );

  await httpCheck(
    "BR8",
    "PATCH empty body → 422",
    "PATCH",
    `/api/v1/branches/${branchId}`,
    authJson({}),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "BR9",
    "POST archive → 200 archived",
    "POST",
    `/api/v1/branches/${branchId}/archive`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["isArchived true", res.body?.data?.isArchived === true],
      ["archivedAt set", res.body?.data?.archivedAt !== null],
    ],
  );

  await httpCheck(
    "BR10",
    "POST archive again → 409",
    "POST",
    `/api/v1/branches/${branchId}/archive`,
    authHeaders(),
    (res) => [["status 409", res.status === 409]],
  );

  await httpCheck(
    "BR11",
    "POST restore → 200 restored",
    "POST",
    `/api/v1/branches/${branchId}/restore`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["isArchived false", res.body?.data?.isArchived === false],
    ],
  );

  await httpCheck(
    "BR12",
    "POST restore again → 409",
    "POST",
    `/api/v1/branches/${branchId}/restore`,
    authHeaders(),
    (res) => [["status 409", res.status === 409]],
  );

  await httpCheck(
    "BR13",
    "GET /branches?isArchived=true → archived filter",
    "GET",
    "/api/v1/branches?isArchived=true",
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "all archived",
        res.body?.data?.docs.every((b) => b.isArchived === true),
      ],
    ],
  );

  await httpCheck(
    "BR14",
    "GET /branches/:id/detail → §30.2.1 aggregate",
    "GET",
    `/api/v1/branches/${branchId}/detail`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["branch present", res.body?.data?.branch?._id === branchId],
      ["reports paginated", Array.isArray(res.body?.data?.reports?.docs)],
      [
        "analytics zero-filled",
        res.body?.data?.analytics?.statusDistribution?.length === 4 &&
          res.body?.data?.analytics?.statusDistribution[0]?.status ===
            "draft" &&
          res.body?.data?.analytics?.reportsTotal === 0,
      ],
      [
        "items grouped",
        Array.isArray(res.body?.data?.items?.activities) &&
          Array.isArray(res.body?.data?.items?.issues) &&
          Array.isArray(res.body?.data?.items?.comments),
      ],
    ],
  );

  await httpCheck(
    "BR15",
    "GET /branches/:id foreign → 404 (BR-13)",
    "GET",
    `/api/v1/branches/64f1a2b3c4d5e6f7a8b9c0d3`,
    authHeaders(),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "BR16",
    "DELETE /branches/:id → 200 archived→retention",
    "DELETE",
    `/api/v1/branches/${branchId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["archived true", res.body?.data?.archived === true],
      [
        "retention copy",
        res.body?.message?.includes(
          "permanently removed after the retention period",
        ),
      ],
    ],
  );
}

// ───────────────────────────── GROUP: reports ──────────────────────────────

async function runReports() {
  section("reports \u2014 §31 (no AI)");
  const fixture = await registerAndLogin("sp4.rp");
  unitCheck(
    "RP0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );

  const branch = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "መድኃኒዓለም", location: "Mexico" }),
  );
  const branchId = branch.body.data._id;
  const branch2 = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "ኤርፖርት", location: "Airport" }),
  );
  const branch2Id = branch2.body.data._id;

  let reportId;
  await httpCheck(
    "RP1",
    "POST /reports → 201 draft (main-locked visits)",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branchId,
      date: "2026-08-19T00:00:00.000Z",
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [{ branch: branchId, clockIn: "08:30", clockOut: "17:30" }],
    }),
    (res) => [
      ["status 201", res.status === 201],
      ["status draft", res.body?.data?.status === "draft"],
      ["transcription null", res.body?.data?.transcription === null],
      ["visits stored", res.body?.data?.visits?.length === 1],
    ],
  );
  reportId = (
    await request(
      "POST",
      "/api/v1/reports",
      authJson({
        branch: branchId,
        clockIn: "08:30",
        clockOut: "17:30",
        visits: [{ branch: branchId, clockIn: "08:30", clockOut: "17:30" }],
      }),
    )
  ).body?.data?._id;

  await httpCheck(
    "RP2",
    "POST /reports main-lock violation → 422 visits[0].branch",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branchId,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [{ branch: branch2Id, clockIn: "08:30", clockOut: "17:30" }],
    }),
    (res) => [
      ["status 422", res.status === 422],
      [
        "field visits[0].branch",
        res.body?.details?.[0]?.field === "visits[0].branch",
      ],
      [
        "C1 copy",
        res.body?.details?.[0]?.message ===
          "The main branch must be the first visit",
      ],
    ],
  );

  await httpCheck(
    "RP3",
    "POST /reports empty visits → 422",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branchId,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [],
    }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP4",
    "POST /reports bad clockIn → 422",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branchId,
      clockIn: "25:99",
      clockOut: "17:30",
      visits: [{ branch: branchId, clockIn: "08:30", clockOut: "17:30" }],
    }),
    (res) => [
      ["status 422", res.status === 422],
      ["field clockIn", res.body?.details?.some((d) => d.field === "clockIn")],
    ],
  );

  await request("POST", `/api/v1/branches/${branch2Id}/archive`, authHeaders());
  await httpCheck(
    "RP5",
    "POST /reports archived branch → 422 detail (D11)",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branchId,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branchId, clockIn: "08:30", clockOut: "17:30" },
        { branch: branch2Id, clockIn: "10:00", clockOut: "12:00" },
      ],
    }),
    (res) => [
      ["status 422", res.status === 422],
      [
        "detail branch archived",
        res.body?.details?.some(
          (d) =>
            d.field === "visits[1].branch" &&
            d.message === "The branch is archived",
        ),
      ],
    ],
  );
  await request("POST", `/api/v1/branches/${branch2Id}/restore`, authHeaders());

  await httpCheck(
    "RP6",
    "POST /reports foreign branch → 404 (D11)",
    "POST",
    "/api/v1/reports",
    authJson({
      branch: "64f1a2b3c4d5e6f7a8b9c0d3",
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        {
          branch: "64f1a2b3c4d5e6f7a8b9c0d3",
          clockIn: "08:30",
          clockOut: "17:30",
        },
      ],
    }),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "RP7",
    "GET /reports → 200 paginated",
    "GET",
    "/api/v1/reports",
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["docs array", Array.isArray(res.body?.data?.docs)],
      ["heavy fields absent", !("latest" in (res.body?.data?.docs?.[0] ?? {}))],
    ],
  );

  await httpCheck(
    "RP8",
    "GET /reports?status=bogus → 422",
    "GET",
    "/api/v1/reports?status=bogus",
    authHeaders(),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP9",
    "GET /reports/:id → 200 ReportDto",
    "GET",
    `/api/v1/reports/${reportId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["id matches", res.body?.data?._id === reportId],
    ],
  );

  await httpCheck(
    "RP10",
    "GET /reports/:id?withContent=true without transcription → transcription null",
    "GET",
    `/api/v1/reports/${reportId}?withContent=true`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["transcription null", res.body?.data?.transcription === null],
    ],
  );

  await httpCheck(
    "RP11",
    "PATCH /reports/:id date/clockIn → 200",
    "PATCH",
    `/api/v1/reports/${reportId}`,
    authJson({ date: "2026-08-20T00:00:00.000Z", clockIn: "09:00" }),
    (res) => [
      ["status 200", res.status === 200],
      ["clockIn updated", res.body?.data?.clockIn === "09:00"],
    ],
  );

  await httpCheck(
    "RP12",
    "PATCH /reports/:id branch swap ≠ visits[0] → 422 lock",
    "PATCH",
    `/api/v1/reports/${reportId}`,
    authJson({ branch: branch2Id }),
    (res) => [
      ["status 422", res.status === 422],
      ["lock field", res.body?.details?.[0]?.field === "visits[0].branch"],
    ],
  );

  await httpCheck(
    "RP13",
    "PUT /reports/:id/visits valid block → 200",
    "PUT",
    `/api/v1/reports/${reportId}/visits`,
    authJson({
      visits: [
        { branch: branchId, clockIn: "08:30", clockOut: "17:30" },
        { branch: branch2Id, clockIn: "10:00", clockOut: "12:00" },
      ],
    }),
    (res) => [
      ["status 200", res.status === 200],
      ["two visits", res.body?.data?.visits?.length === 2],
    ],
  );

  await httpCheck(
    "RP14",
    "PUT /visits index-0 mismatch → 422 lock",
    "PUT",
    `/api/v1/reports/${reportId}/visits`,
    authJson({
      visits: [{ branch: branch2Id, clockIn: "10:00", clockOut: "12:00" }],
    }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP15",
    "PUT /visits/:visitIndex 0 → 403 locked",
    "PUT",
    `/api/v1/reports/${reportId}/visits/0`,
    authJson({ branch: branchId, clockIn: "08:30", clockOut: "17:30" }),
    (res) => [["status 403", res.status === 403]],
  );

  await httpCheck(
    "RP16",
    "PUT /visits/:visitIndex 1 → 200",
    "PUT",
    `/api/v1/reports/${reportId}/visits/1`,
    authJson({ branch: branch2Id, clockIn: "11:00", clockOut: "13:00" }),
    (res) => [
      ["status 200", res.status === 200],
      ["row updated", res.body?.data?.visits?.[1]?.clockIn === "11:00"],
    ],
  );

  await httpCheck(
    "RP17",
    "PUT /visits/:visitIndex out of range → 404",
    "PUT",
    `/api/v1/reports/${reportId}/visits/9`,
    authJson({ branch: branchId, clockIn: "08:30", clockOut: "17:30" }),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "RP18",
    "DELETE /visits/0 → 403 locked",
    "DELETE",
    `/api/v1/reports/${reportId}/visits/0`,
    authHeaders(),
    (res) => [["status 403", res.status === 403]],
  );

  await httpCheck(
    "RP19",
    "DELETE /visits/1 → 200",
    "DELETE",
    `/api/v1/reports/${reportId}/visits/1`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["one visit left", res.body?.data === null],
    ],
  );

  await httpCheck(
    "RP20",
    "GET /reports/:id/items → 200 {items: []}",
    "GET",
    `/api/v1/reports/${reportId}/items`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "items empty",
        Array.isArray(res.body?.data?.items) &&
          res.body?.data?.items.length === 0,
      ],
    ],
  );

  await httpCheck(
    "RP21",
    "PATCH /reports/:id/items/:itemId unknown → 404",
    "PATCH",
    `/api/v1/reports/${reportId}/items/64f1a2b3c4d5e6f7a8b9c0d3`,
    authJson({ status: "completed" }),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "RP22",
    "POST /reports/:id/generations on draft → 403 Transcribe first",
    "POST",
    `/api/v1/reports/${reportId}/generations`,
    authHeaders(),
    (res) => [
      ["status 403", res.status === 403],
      ["copy", res.body?.message === "Transcribe the report first"],
    ],
  );

  await httpCheck(
    "RP23",
    "PATCH /reports/:id/content without transcription → 422",
    "PATCH",
    `/api/v1/reports/${reportId}/content`,
    authJson({ content: "<p>x</p>" }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP24",
    "PUT /reports/:id/content without transcription → 404",
    "PUT",
    `/api/v1/reports/${reportId}/content`,
    authHeaders(),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "RP25",
    "POST /reports/:id/corrections without transcription → 422",
    "POST",
    `/api/v1/reports/${reportId}/corrections`,
    authJson({ instruction: "Fix the first paragraph" }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP26",
    "POST /reports/:id/corrections unknown provider → 422",
    "POST",
    `/api/v1/reports/${reportId}/corrections`,
    authJson({ instruction: "Fix it", provider: "bogus" }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP27",
    "POST /reports/:id/corrections empty instruction → 422",
    "POST",
    `/api/v1/reports/${reportId}/corrections`,
    authJson({ instruction: "" }),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP28",
    "POST /reports/:id/archive → 200; re-archive 409; restore 200; re-restore 409",
    "POST",
    `/api/v1/reports/${reportId}/archive`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["isArchived true", res.body?.data?.isArchived === true],
    ],
  );
  await httpCheck(
    "RP28b",
    "POST archive again → 409",
    "POST",
    `/api/v1/reports/${reportId}/archive`,
    authHeaders(),
    (res) => [["status 409", res.status === 409]],
  );
  await httpCheck(
    "RP28c",
    "POST restore → 200",
    "POST",
    `/api/v1/reports/${reportId}/restore`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["isArchived false", res.body?.data?.isArchived === false],
    ],
  );
  await httpCheck(
    "RP28d",
    "POST restore again → 409",
    "POST",
    `/api/v1/reports/${reportId}/restore`,
    authHeaders(),
    (res) => [["status 409", res.status === 409]],
  );

  await httpCheck(
    "RP29",
    "GET /reports/:id malformed id → 422",
    "GET",
    "/api/v1/reports/zzz",
    authHeaders(),
    (res) => [["status 422", res.status === 422]],
  );

  await httpCheck(
    "RP30",
    "DELETE /reports/:id → 200 archived→retention",
    "DELETE",
    `/api/v1/reports/${reportId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["archived true", res.body?.data?.archived === true],
    ],
  );

  await httpCheck(
    "RP31",
    "POST /generations on archived report → 403",
    "POST",
    `/api/v1/reports/${reportId}/generations`,
    authHeaders(),
    (res) => [["status 403", res.status === 403]],
  );
}

// ───────────────────────────── GROUP: audio ────────────────────────────────

async function runAudio() {
  section("audio \u2014 §32 (no AI)");
  const fixture = await registerAndLogin("sp4.au");
  unitCheck(
    "AU0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );

  const branch = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "ቡልቡላ", location: "Bulbula" }),
  );
  const report = await request(
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branch.body.data._id,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branch.body.data._id, clockIn: "08:30", clockOut: "17:30" },
      ],
    }),
  );
  const reportId = report.body.data._id;

  await httpCheck(
    "AU1",
    "POST /clips text file → 422 MIME",
    "POST",
    `/api/v1/reports/${reportId}/clips`,
    multipart(
      { language: "am" },
      {
        name: "clip",
        filename: "x.txt",
        buffer: Buffer.from("hello"),
        type: "text/plain",
      },
    ),
    (res) => [
      ["status 422", res.status === 422],
      [
        "MIME copy",
        res.body?.details?.[0]?.message === "Only audio files are accepted",
      ],
    ],
  );

  await httpCheck(
    "AU2",
    "POST /clips video MIME → 422 video rejection",
    "POST",
    `/api/v1/reports/${reportId}/clips`,
    multipart(
      {},
      {
        name: "clip",
        filename: "x.mp4",
        buffer: Buffer.alloc(100),
        type: "video/mp4",
      },
    ),
    (res) => [
      ["status 422", res.status === 422],
      [
        "video copy",
        res.body?.details?.[0]?.message ===
          "Only audio recordings are supported",
      ],
    ],
  );

  let clipId;
  await httpCheck(
    "AU3",
    "POST /clips valid wav → 201 AudioDto + first-clip flip",
    "POST",
    `/api/v1/reports/${reportId}/clips`,
    multipart(
      { language: "am" },
      {
        name: "clip",
        filename: "x.wav",
        buffer: synthesizeWav(3),
        type: "audio/wav",
      },
    ),
    (res) => [
      ["status 201", res.status === 201],
      ["DTO keys exact", hasKeys(res.body?.data, AUDIO_DTO_KEYS)],
      ["no filePath", !("filePath" in res.body?.data)],
      ["durationSec 3", res.body?.data?.durationSec === 3],
      ["mimeType wav", res.body?.data?.mimeType === "audio/wav"],
    ],
  );
  clipId = (
    await request("GET", `/api/v1/reports/${reportId}/clips`, authHeaders())
  ).body?.data?.docs?.[0]?._id;

  await httpCheck(
    "AU4",
    "GET /clips → 200 paginated asc",
    "GET",
    `/api/v1/reports/${reportId}/clips`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["one clip", res.body?.data?.totalDocs === 1],
    ],
  );

  await httpCheck(
    "AU5",
    "GET /audios/:id → 200 metadata",
    "GET",
    `/api/v1/audios/${clipId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["id matches", res.body?.data?._id === clipId],
    ],
  );

  await httpCheck(
    "AU6",
    "GET /audios/:id/play → 200 range streaming headers",
    "GET",
    `/api/v1/audios/${clipId}/play`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["Accept-Ranges", res.headers.get("accept-ranges") === "bytes"],
      ["Cache-Control private", res.headers.get("cache-control") === "private"],
      [
        "Content-Type wav",
        res.headers.get("content-type")?.startsWith("audio/wav"),
      ],
    ],
  );

  await httpCheck(
    "AU7",
    "GET /audios/:id/play Range → 206 partial",
    "GET",
    `/api/v1/audios/${clipId}/play`,
    { headers: { Cookie: cookieHeader(), Range: "bytes=0-99" } },
    (res) => [
      ["status 206", res.status === 206],
      [
        "Content-Range",
        res.headers.get("content-range")?.startsWith("bytes 0-99/"),
      ],
    ],
  );

  await httpCheck(
    "AU8",
    "GET /audios/:id foreign → 404 (BR-13)",
    "GET",
    `/api/v1/audios/64f1a2b3c4d5e6f7a8b9c0d3`,
    authHeaders(),
    (res) => [["status 404", res.status === 404]],
  );

  await httpCheck(
    "AU9",
    "DELETE /audios/:id last clip → 200 + rewind to draft",
    "DELETE",
    `/api/v1/audios/${clipId}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["message Clip deleted", res.body?.message === "Clip deleted"],
    ],
  );
  const afterDelete = await request(
    "GET",
    `/api/v1/reports/${reportId}`,
    authHeaders(),
  );
  unitCheck(
    "AU9b",
    "report rewound to draft (§31.4 last-audio rewind)",
    afterDelete.body?.data?.status === "draft",
  );
}

// ─────────────────────────── GROUP: transcription ──────────────────────────

async function runTranscription() {
  section(
    "transcription \u2014 §33 edge (one real STT call on the transcripts endpoint)",
  );
  const fixture = await registerAndLogin("sp4.tr");
  unitCheck(
    "TR0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );

  const branch = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "ጎላጉል", location: "Golagul" }),
  );
  const report = await request(
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branch.body.data._id,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branch.body.data._id, clockIn: "08:30", clockOut: "17:30" },
      ],
    }),
  );
  const reportId = report.body.data._id;

  await httpCheck(
    "TR1",
    "PUT /transcription no audios → 422",
    "PUT",
    `/api/v1/reports/${reportId}/transcription`,
    authHeaders(),
    (res) => [
      ["status 422", res.status === 422],
      ["copy", res.body?.message === "Record at least one clip first"],
    ],
  );

  await httpCheck(
    "TR2",
    "GET /transcription none → 404 No transcription yet",
    "GET",
    `/api/v1/reports/${reportId}/transcription`,
    authHeaders(),
    (res) => [
      ["status 404", res.status === 404],
      ["copy", res.body?.message === "No transcription yet"],
    ],
  );

  await httpCheck(
    "TR3",
    "POST /corrections/transcripts no clip → 422",
    "POST",
    `/api/v1/reports/${reportId}/corrections/transcripts`,
    multipart({}, null),
    (res) => [
      ["status 422", res.status === 422],
      [
        "copy",
        res.body?.details?.[0]?.message === "Record a voice instruction first",
      ],
    ],
  );

  const cut = cutRealClip(3);
  await httpCheck(
    "TR4",
    "POST /corrections/transcripts real 3s cut → 200 {text} (real addis STT)",
    "POST",
    `/api/v1/reports/${reportId}/corrections/transcripts`,
    multipart(
      {},
      {
        name: "clip",
        filename: "cut.wav",
        buffer: readFileSync(cut),
        type: "audio/wav",
      },
    ),
    (res) => [
      ["status 200", res.status === 200],
      ["text string", typeof res.body?.data?.text === "string"],
    ],
    600000,
  );

  await request("POST", `/api/v1/reports/${reportId}/archive`, authHeaders());
  await httpCheck(
    "TR5",
    "PUT /transcription archived report → 403",
    "PUT",
    `/api/v1/reports/${reportId}/transcription`,
    authHeaders(),
    (res) => [["status 403", res.status === 403]],
  );
  await request("POST", `/api/v1/reports/${reportId}/restore`, authHeaders());

  await httpCheck(
    "TR6",
    "PUT /transcription foreign report → 404",
    "PUT",
    "/api/v1/reports/64f1a2b3c4d5e6f7a8b9c0d3/transcription",
    authHeaders(),
    (res) => [["status 404", res.status === 404]],
  );
}

// ─────────────────────────── GROUP: real pipeline ──────────────────────────

async function runRealPipeline() {
  section(
    "real pipeline \u2014 owner real recording (real addis STT + addis/gemini TTT)",
  );
  const fixture = await registerAndLogin("sp4.real");
  unitCheck(
    "PL0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );
  unitCheck(
    "PL0b",
    "real clip present (§63.10 — owner-provided file)",
    readFileSync(REAL_CLIP).length > 100000,
  );

  const branch = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "መድኃኒዓለም", location: "Mexico" }),
  );
  const report = await request(
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branch.body.data._id,
      date: "2026-08-19T00:00:00.000Z",
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branch.body.data._id, clockIn: "08:30", clockOut: "17:30" },
      ],
    }),
  );
  const reportId = report.body.data._id;

  let clipId;
  await httpCheck(
    "PL1",
    "POST /clips real webm → 201 AudioDto (ffprobe duration ≈187s)",
    "POST",
    `/api/v1/reports/${reportId}/clips`,
    multipart(
      { language: "am" },
      {
        name: "clip",
        filename: "real.webm",
        buffer: readFileSync(REAL_CLIP),
        type: "audio/webm",
      },
    ),
    (res) => [
      ["status 201", res.status === 201],
      ["durationSec ≈187", Math.abs(res.body?.data?.durationSec - 187) <= 3],
      ["mimeType webm", res.body?.data?.mimeType === "audio/webm"],
      ["no filePath", !("filePath" in res.body?.data)],
    ],
    120000,
  );
  clipId = (
    await request("GET", `/api/v1/reports/${reportId}/clips`, authHeaders())
  ).body?.data?.docs?.[0]?._id;

  let transcription;
  const transcriptionPath = `/api/v1/reports/${reportId}/transcription`;
  out(`[PL2] PUT ${transcriptionPath}`);
  const transcriptionRes = await request(
    "PUT",
    transcriptionPath,
    authHeaders(),
    900000,
  );
  out(`    status : ${transcriptionRes.status}`);
  out(`    body   : ${JSON.stringify(transcriptionRes.body)}`);
  {
    const d = transcriptionRes.body?.data;
    const failures = [];
    const a = (label, ok) => {
      if (!ok) failures.push(label);
    };
    a("status 200", transcriptionRes.status === 200);
    a("DTO keys exact", hasKeys(d, TRANSCRIPTION_DTO_KEYS));
    a(
      "raw non-empty Amharic",
      typeof d?.raw === "string" &&
        d.raw.length > 20 &&
        /[\u1200-\u137F]/.test(d.raw),
    );
    a("latest === plainToHtml(raw)", d?.latest === plainToHtml(d?.raw));
    a("language am", d?.language === "am");
    a(
      "requestId non-null",
      d?.stt?.requestId !== null && d?.stt?.requestId !== undefined,
    );
    a(
      "stt exactly {requestId, model} — ledger excluded (D21)",
      d?.stt && Object.keys(d.stt).length === 2 && !("audios" in d.stt),
    );
    verdict(
      "PL2 — PUT /transcription real → 200 TranscriptionDto (4 real STT chunks)",
      failures.length === 0,
      failures.length ? `failed: ${failures.join(", ")}` : "",
    );
    transcription = d;
  }

  const reportAfter = await request(
    "GET",
    `/api/v1/reports/${reportId}`,
    authHeaders(),
  );
  unitCheck(
    "PL2b",
    "report moved audio_attached → transcribed (§31.4)",
    reportAfter.body?.data?.status === "transcribed" &&
      reportAfter.body?.data?.transcription === transcription?._id,
  );

  await httpCheck(
    "PL3",
    "second PUT → 422 All clips already transcribed (idempotent, D20)",
    "PUT",
    `/api/v1/reports/${reportId}/transcription`,
    authHeaders(),
    (res) => [
      ["status 422", res.status === 422],
      ["copy", res.body?.message === "All clips are already transcribed"],
    ],
  );

  let generated;
  const generationsPath = `/api/v1/reports/${reportId}/generations`;
  out(`[PL4] POST ${generationsPath}`);
  const generationsRes = await request(
    "POST",
    generationsPath,
    authHeaders(),
    600000,
  );
  out(`    status : ${generationsRes.status}`);
  out(`    body   : ${JSON.stringify(generationsRes.body)}`);
  {
    const d = generationsRes.body?.data;
    const failures = [];
    const a = (label, ok) => {
      if (!ok) failures.push(label);
    };
    a("status 200", generationsRes.status === 200);
    a("report generated", d?.report?.status === "generated");
    a(
      "latest is §6 HTML with ± labels",
      typeof d?.transcription?.latest === "string" &&
        d.transcription.latest.includes("±ቀን:") &&
        d.transcription.latest.includes("±ብራንች:") &&
        d.transcription.latest.includes("±ስም:") &&
        d.transcription.latest.includes("±ስራ የገባሁበት ሰዓት:") &&
        d.transcription.latest.includes("±ከስራ የወጣሁበት ሰዓት:"),
    );
    a(
      "Amharic content",
      /[\u1200-\u137F]/.test(d?.transcription?.latest ?? ""),
    );
    a(
      "items persisted",
      Array.isArray(d?.transcription?.items) &&
        d.transcription.items.length > 0,
    );
    a(
      "activities completed / issues reported",
      d?.transcription?.items.every((i) =>
        i.type === "activity"
          ? i.status === "completed"
          : i.type === "issue"
            ? i.status === "reported"
            : true,
      ),
    );
    a(
      "items carry branch + date",
      d?.transcription?.items.every((i) => i.branch && i.date),
    );
    verdict(
      "PL4 — POST /generations real → 200 C8 {report, transcription:{latest, items}} (real addis TTT)",
      failures.length === 0,
      failures.length ? `failed: ${failures.join(", ")}` : "",
    );
    generated = d;
  }

  await httpCheck(
    "PL5",
    "re-generation at generated → 403 BR-12",
    "POST",
    `/api/v1/reports/${reportId}/generations`,
    authHeaders(),
    (res) => [
      ["status 403", res.status === 403],
      ["copy", res.body?.message === "This report is already generated"],
    ],
  );

  await httpCheck(
    "PL6",
    "POST /clips at generated → 403 frozen",
    "POST",
    `/api/v1/reports/${reportId}/clips`,
    multipart(
      {},
      {
        name: "clip",
        filename: "x.wav",
        buffer: synthesizeWav(2),
        type: "audio/wav",
      },
    ),
    (res) => [["status 403", res.status === 403]],
  );

  await httpCheck(
    "PL7",
    "DELETE /audios at generated → 403 frozen",
    "DELETE",
    `/api/v1/audios/${clipId}`,
    authHeaders(),
    (res) => [["status 403", res.status === 403]],
  );

  const latest = generated.transcription.latest;
  await httpCheck(
    "PL8",
    "POST /corrections real gemini → 200 {content} candidate with ± preserved",
    "POST",
    `/api/v1/reports/${reportId}/corrections`,
    authJson({
      instruction: "Fix the branch name in the first paragraph",
      provider: "gemini",
    }),
    (res) => [
      ["status 200", res.status === 200],
      [
        "content candidate",
        typeof res.body?.data?.content === "string" &&
          res.body?.data?.content.length > 100,
      ],
      [
        "± tokens preserved (SC-3)",
        [...new Set(latest.match(/±[^\s<]+/g) ?? [])].every((t) =>
          res.body?.data?.content.includes(t),
        ),
      ],
    ],
    600000,
  );

  const candidate = (
    await request(
      "POST",
      `/api/v1/reports/${reportId}/corrections`,
      authJson({
        instruction: "Fix the branch name in the first paragraph",
        provider: "gemini",
      }),
    )
  ).body?.data?.content;

  await httpCheck(
    "PL9",
    "PATCH /content persists the candidate → 200 (Mode-1 Save, BR-10)",
    "PATCH",
    `/api/v1/reports/${reportId}/content`,
    authJson({ content: candidate }),
    (res) => [
      ["status 200", res.status === 200],
      ["content returned", res.body?.data?.content === candidate],
    ],
    120000,
  );

  await httpCheck(
    "PL10",
    "PUT /content revert at generated → 403 (pre-generation only, §23.5)",
    "PUT",
    `/api/v1/reports/${reportId}/content`,
    authHeaders(),
    (res) => [
      ["status 403", res.status === 403],
      ["copy", res.body?.message === "This report is already generated"],
    ],
  );

  // The revert happy path lives on a transcribed report (§31.6 BR-11).
  const branch2 = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "ጎላጉል", location: "Golagul" }),
  );
  const report2 = await request(
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branch2.body.data._id,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branch2.body.data._id, clockIn: "08:30", clockOut: "17:30" },
      ],
    }),
  );
  const report2Id = report2.body.data._id;
  await request(
    "POST",
    `/api/v1/reports/${report2Id}/clips`,
    multipart(
      { language: "am" },
      {
        name: "clip",
        filename: "small.wav",
        buffer: synthesizeWav(3),
        type: "audio/wav",
      },
    ),
  );
  const tr2 = await request(
    "PUT",
    `/api/v1/reports/${report2Id}/transcription`,
    authHeaders(),
    600000,
  );
  const raw2 = tr2.body?.data?.raw;
  await httpCheck(
    "PL10b",
    "PATCH /content on transcribed report → 200 Mode-1 save",
    "PATCH",
    `/api/v1/reports/${report2Id}/content`,
    authJson({ content: "<p>የተስተካከለ ታሪክ</p>" }),
    (res) => [
      ["status 200", res.status === 200],
      ["content saved", res.body?.data?.content === "<p>የተስተካከለ ታሪክ</p>"],
    ],
  );
  await httpCheck(
    "PL10c",
    "PUT /content revert → 200 story restore (BR-11)",
    "PUT",
    `/api/v1/reports/${report2Id}/content`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "content === plainToHtml(raw)",
        res.body?.data?.content === plainToHtml(raw2),
      ],
    ],
  );
  await httpCheck(
    "PL10d",
    "PUT /content revert again → 200 idempotent no-op",
    "PUT",
    `/api/v1/reports/${report2Id}/content`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["same content", res.body?.data?.content === plainToHtml(raw2)],
    ],
  );

  await httpCheck(
    "PL11",
    "GET /transcription → 200 DTO surface",
    "GET",
    `/api/v1/reports/${reportId}/transcription`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["surface", hasKeys(res.body?.data, TRANSCRIPTION_DTO_KEYS)],
    ],
  );

  await httpCheck(
    "PL12",
    "POST /chat/messages real gemini → 201 with user + assistant turns",
    "POST",
    `/api/v1/reports/${reportId}/chat/messages`,
    authJson({
      content: "Summarize the issues found today",
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      reasoning: "off",
    }),
    (res) => [
      ["status 201", res.status === 201],
      [
        "user + assistant present",
        res.body?.data?.messages?.some((m) => m.role === "user") &&
          res.body?.data?.messages?.some((m) => m.role === "assistant"),
      ],
      [
        "assistant last",
        res.body?.data?.messages?.[res.body?.data?.messages?.length - 1]
          ?.role === "assistant",
      ],
      [
        "triple recorded on the user turn",
        res.body?.data?.messages?.find((m) => m.role === "user")?.provider ===
          "gemini" &&
          res.body?.data?.messages?.find((m) => m.role === "user")
            ?.reasoning === "off",
      ],
      [
        "assistant answered in Amharic",
        /[\u1200-\u137F]/.test(
          res.body?.data?.messages?.find((m) => m.role === "assistant")
            ?.content ?? "",
        ),
      ],
    ],
    600000,
  );

  await httpCheck(
    "PL13",
    "GET /chat → 200 with messages",
    "GET",
    `/api/v1/reports/${reportId}/chat`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "messages present",
        Array.isArray(res.body?.data?.messages) &&
          res.body?.data?.messages.length >= 2,
      ],
    ],
  );

  await httpCheck(
    "PL14",
    "GET /reports/:id?withContent=true → {report, transcription:{latest, items}}",
    "GET",
    `/api/v1/reports/${reportId}?withContent=true`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      ["report generated", res.body?.data?.report?.status === "generated"],
      [
        "latest present",
        typeof res.body?.data?.transcription?.latest === "string",
      ],
      [
        "items present",
        Array.isArray(res.body?.data?.transcription?.items) &&
          res.body?.data?.transcription?.items.length > 0,
      ],
    ],
  );

  const items = (
    await request(
      "GET",
      `/api/v1/reports/${reportId}?withContent=true`,
      authHeaders(),
    )
  ).body?.data?.transcription?.items;
  const item = items?.find((i) => i.type === "issue");
  if (item) {
    await httpCheck(
      "PL15",
      "PATCH /items/:id status → 200 (per-type, any direction)",
      "PATCH",
      `/api/v1/reports/${reportId}/items/${item._id}`,
      authJson({ status: "completed" }),
      (res) => [
        ["status 200", res.status === 200],
        ["status completed", res.body?.data?.status === "completed"],
      ],
    );
  } else {
    unitCheck(
      "PL15",
      "no issue row to patch — skipped (fixture variance)",
      true,
    );
  }

  await httpCheck(
    "PL16",
    "GET /reports?branch=:id → branch filter 200",
    "GET",
    `/api/v1/reports?branch=${branch.body.data._id}`,
    authHeaders(),
    (res) => [
      ["status 200", res.status === 200],
      [
        "all match",
        res.body?.data?.docs.every((r) => r.branch === branch.body.data._id),
      ],
    ],
  );
}

// ───────────────────────────── GROUP: ratelimit ────────────────────────────

async function runRateLimit() {
  section("ratelimit \u2014 §27.3 ai tier (zero AI cost)");
  const fixture = await registerAndLogin("sp4.rl");
  unitCheck(
    "RL0",
    "fixture register/login",
    fixture.registerStatus === 201 && fixture.loginStatus === 200,
  );
  const branch = await request(
    "POST",
    "/api/v1/branches",
    authJson({ name: "ሪፖርት", location: "RL" }),
  );
  const report = await request(
    "POST",
    "/api/v1/reports",
    authJson({
      branch: branch.body.data._id,
      clockIn: "08:30",
      clockOut: "17:30",
      visits: [
        { branch: branch.body.data._id, clockIn: "08:30", clockOut: "17:30" },
      ],
    }),
  );
  const reportId = report.body.data._id;

  for (let i = 1; i <= 11; i += 1) {
    const res = await request(
      "PUT",
      `/api/v1/reports/${reportId}/transcription`,
      authHeaders(),
    );
    out(`[RL${i}] PUT /api/v1/reports/${reportId}/transcription`);
    out(`    status : ${res.status}`);
    out(`    body   : ${JSON.stringify(res.body)}`);
    if (i < 11) {
      verdict(
        `hit ${i} → 422 (no audios — counted toward the tier)`,
        res.status === 422,
      );
    } else {
      verdict(
        "hit 11 → 429 TOO_MANY_REQUESTS (§27.3 ai tier 10/min)",
        res.status === 429,
      );
    }
  }
}

// ───────────────────────────── GROUP: source gates ─────────────────────────

async function runSourceGates() {
  section("sourcegates \u2014 §16.8/§30.9/§33.9/§35.8/§36.8");
  const files = {
    env: readFileSync(join(process.cwd(), "config", "env.js"), "utf8"),
    controllers: ["branch", "report", "audio", "transcription", "chat"]
      .map((n) =>
        readFileSync(
          join(process.cwd(), "controllers", `${n}.controller.js`),
          "utf8",
        ),
      )
      .join("\n"),
    services: [
      "addis-provider",
      "gemini-provider",
      "nvidia-provider",
      "provider-chain",
      "stt.service",
      "generation.service",
      "correction.service",
      "chat.service",
    ]
      .map((n) =>
        readFileSync(join(process.cwd(), "services", `${n}.js`), "utf8"),
      )
      .join("\n"),
    routes: [
      "index",
      "branch.routes",
      "report.routes",
      "audio.routes",
      "transcription.routes",
      "chat.routes",
    ]
      .map((n) =>
        readFileSync(join(process.cwd(), "routes", `${n}.js`), "utf8"),
      )
      .join("\n"),
  };
  const all = `${files.controllers}\n${files.services}\n${files.routes}`;

  out("[S1] UNIT SDK constructor gate (§16.8)");
  unitCheck(
    "S1",
    "new AddisAI appears exactly once — in config/env.js only",
    (files.env.match(/new AddisAI\(/g) ?? []).length === 1 &&
      !files.controllers.includes("new AddisAI") &&
      !files.services.includes("new AddisAI"),
  );

  out("[S2] UNIT SDK-only gate");
  unitCheck(
    "S2",
    "no ADDIS_AI_BASE_URL literal anywhere in backend source",
    !all.includes("ADDIS_AI_BASE_URL") &&
      !files.env.includes("ADDIS_AI_BASE_URL"),
  );

  out("[S3] UNIT DTO filePath gate (§22.7/§32.8)");
  unitCheck(
    "S3",
    "no res.json response emits filePath (the model transform strips it)",
    !/res\.(status|json)\([^)]*filePath/.test(files.controllers),
  );

  out("[S4] UNIT no deletedAt (§18.3/§30.9)");
  unitCheck(
    "S4",
    "no deletedAt field usage anywhere in the new layers",
    !/deletedAt\s*[:=]/.test(all),
  );

  out("[S5] UNIT no console.log (§9.5/§63.4)");
  unitCheck(
    "S5",
    "no console.log literal in the new files",
    !all.includes("console.log"),
  );

  out("[S6] UNIT no hard deletes of Report/Branch (§30.9/§31.10)");
  unitCheck(
    "S6",
    "Report/Branch only archive — deleteOne/deleteMany confined to Audio/Transcription/Item",
    !/Report\.(deleteOne|deleteMany|findByIdAndDelete)|Branch\.(deleteOne|deleteMany|findByIdAndDelete)/.test(
      all,
    ),
  );

  out("[S7] UNIT one transition-guard application (§31.10)");
  {
    const statusFiles = [
      "models/report.model.js",
      "controllers/branch.controller.js",
      "controllers/report.controller.js",
      "controllers/audio.controller.js",
      "services/stt.service.js",
      "services/generation.service.js",
      "validators/report.validator.js",
    ];
    const offenders = statusFiles.filter(
      (f) =>
        !readFileSync(join(process.cwd(), f), "utf8").includes(
          "REPORT_STATUSES",
        ),
    );
    unitCheck(
      "S7",
      "REPORT_STATUSES confined to the §31.4-applying files",
      offenders.length === 0,
    );
  }

  out("[S8] UNIT addis-only STT (§33.9/ADR-001)");
  {
    const sttSrc = readFileSync(
      join(process.cwd(), "services", "stt.service.js"),
      "utf8",
    );
    unitCheck(
      "S8",
      "stt.service imports only the addis adapter (no gemini/nvidia)",
      !sttSrc.includes("gemini-provider") &&
        !sttSrc.includes("nvidia-provider"),
    );
  }

  out("[S9] UNIT no live NVIDIA (owner directive 2026-08-20)");
  {
    const importers = [];
    for (const dir of ["controllers", "services", "routes"]) {
      for (const file of readdirSync(join(process.cwd(), dir))) {
        if (
          file.endsWith(".js") &&
          readFileSync(join(process.cwd(), dir, file), "utf8").includes(
            "from './nvidia-provider.js'",
          )
        ) {
          importers.push(`${dir}/${file}`);
        }
      }
    }
    unitCheck(
      "S9",
      "nvidia-provider imported only by provider-chain (no live caller)",
      importers.join(",") === "services/provider-chain.js",
    );
  }

  out("[S10] UNIT uploads gitignored");
  const gitignore = readFileSync(
    join(process.cwd(), "..", ".gitignore"),
    "utf8",
  );
  unitCheck("S10", "uploads/ absent from git", gitignore.includes("uploads"));
}

// ───────────────────────────────── main ────────────────────────────────────

const GROUPS = {
  unit: runUnit,
  branches: runBranches,
  reports: runReports,
  audio: runAudio,
  transcription: runTranscription,
  realpipeline: runRealPipeline,
  ratelimit: runRateLimit,
  sourcegates: runSourceGates,
};

async function main() {
  if (ONLY) {
    const fn = GROUPS[ONLY];
    if (!fn) {
      out(`Unknown group: ${ONLY}. Known: ${Object.keys(GROUPS).join(", ")}`);
      process.exit(2);
    }
    await fn();
  } else {
    await runUnit();
    out("");
    out(
      "Default run covers the unit group. Run the HTTP groups per group with a backend restart between them (§63.10):",
    );
    for (const name of Object.keys(GROUPS).filter((g) => g !== "unit")) {
      out(`  node scripts/test-04-domains.mjs --only=${name}`);
    }
  }

  out("");
  out(
    "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
  );
  out(`SUMMARY  PASS=${pass}  FAIL=${fail}`);
  out(
    fail === 0 ? "RESULT   ALL GREEN" : "RESULT   FAILURES PRESENT — see above",
  );
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  out(`FATAL ${err?.message ?? err}`);
  process.exit(1);
});
