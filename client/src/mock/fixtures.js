/**
 * @module mock/fixtures
 *
 * §66.10 adapter fixture data — the §40 fixture contract for the
 * domain surfaces (the adapter extends to the domain fixtures with
 * its owning phases; this phase is P4). Seed: the §25.3 persona
 * `ቤዛ አያሌው` (beza.ayalew@gmail.com) and the BR-13 second user
 * (henok.getnet@gmail.com); branches with Amharic names (content
 * data — the UI chrome stays English, §7.6); reports spanning every
 * `REPORT_STATUSES` member incl. Type-1/Type-2 days (§6.4), one
 * archived report, one reviewed report whose digest carries an
 * `unassignedItems` entry (the §31.6 accept-gate 422 walk), report
 * content in the §6.8 style with `±` tokens verbatim; clips bound
 * `{ report, visitNo }` (§32.2) with metadata-only DTO surfaces
 * (§22.7 — no `filePath`); per-clip transcriptions (raw/latest
 * single-undo, BR-11; one differing pair); one conversation thread
 * (§24 roles); and the session list of §28.3.
 *
 * This is a **phase artifact** (§66.10): dev-only data, deleted
 * with the adapter at P7 — never a runtime feature.
 */
const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

/**
 * Demo credentials (adapter fixture data, shown at the step-5
 * review): persona `ቤዛ አያሌው` / beza.ayalew@gmail.com and the second
 * BR-13 user. Emails derive the profile name per §19.2.
 * @type {readonly Object[]}
 */
export const MOCK_USERS = deepFreeze([
  {
    _id: "mock-0001",
    email: "beza.ayalew@gmail.com",
    password: "password123",
    firstName: "Beza",
    lastName: "Ayalew",
    fullName: "Beza Ayalew",
    avatar: "",
    position: "Supervisor",
  },
  {
    _id: "mock-0002",
    email: "henok.getnet@gmail.com",
    password: "password123",
    firstName: "Henok",
    lastName: "Getnet",
    fullName: "Henok Getnet",
    avatar: "",
    position: "Supervisor",
  },
]);

/**
 * Adapter behaviour knobs (fixture data, documented): a short latency
 * so loading states and the §42.3 chain are observable in the
 * exit-gate walk; the access token expires after 30s so the reauth
 * walk is practical; the refresh token outlives it by far (session
 * continuity per §28.2).
 * @type {readonly Object<string, number>}
 */
export const MOCK_ADAPTER = deepFreeze({
  latencyMs: 250,
  accessTokenTtlMs: 30000,
  refreshTokenTtlMs: 3600000,
});

/**
 * Branch seeds (§20): seven active branches of the persona + one
 * archived (the tombstone walk — reports keep their `branches[].name`
 * snapshot, BR-14). Locations are content data.
 * @type {readonly Object[]}
 */
export const MOCK_BRANCHES = deepFreeze([
  {
    _id: "branch-0001",
    user: "mock-0001",
    name: "ቦሌ ቅርንጫፍ",
    location: "Bole, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
  },
  {
    _id: "branch-0002",
    user: "mock-0001",
    name: "ፒያሳ ቅርንጫፍ",
    location: "Arada, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-01-15T08:10:00.000Z",
    updatedAt: "2026-01-15T08:10:00.000Z",
  },
  {
    _id: "branch-0003",
    user: "mock-0001",
    name: "ሳርቤት ቅርንጫፍ",
    location: "Sarbet, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-02-02T09:00:00.000Z",
    updatedAt: "2026-02-02T09:00:00.000Z",
  },
  {
    _id: "branch-0004",
    user: "mock-0001",
    name: "ገርጂ ቅርንጫፍ",
    location: "Gerji, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-02-20T09:30:00.000Z",
    updatedAt: "2026-02-20T09:30:00.000Z",
  },
  {
    _id: "branch-0005",
    user: "mock-0001",
    name: "ካዛንቺስ ቅርንጫፍ",
    location: "Kazanchis, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-03-05T10:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z",
  },
  {
    _id: "branch-0006",
    user: "mock-0001",
    name: "መካኒሳ ቅርንጫፍ",
    location: "Mekanisa, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-03-18T10:20:00.000Z",
    updatedAt: "2026-03-18T10:20:00.000Z",
  },
  {
    _id: "branch-0007",
    user: "mock-0001",
    name: "ጎፋ ቅርንጫፍ",
    location: "Gofa, Addis Ababa",
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-04-01T11:00:00.000Z",
    updatedAt: "2026-04-01T11:00:00.000Z",
  },
  {
    _id: "branch-0008",
    user: "mock-0001",
    name: "ላፍቶ ቅርንጫፍ",
    location: "Lafto, Addis Ababa",
    isArchived: true,
    archivedAt: "2026-07-01T12:00:00.000Z",
    createdAt: "2026-02-10T09:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
  },
]);

/**
 * Report-level content seeds (§21.2): `raw` is the plain-text
 * generation truth (OQ-007: plain text — never rewritten, BR-11);
 * `latest` is the current rich-text HTML surface (OQ-007: HTML,
 * sanitized on write/render §61). The `±` prefix marks official
 * text — client renders verbatim, never resolves (§35.3/§53.3).
 */
const RAW_R001 = [
  "ቀን፡ 11-08-26",
  "ብራንች፡ ቦሌ ቅርንጫፍ / ፒያሳ ቅርንጫፍ",
  "ስም፡ ቤዛ አያሌው",
  "ሰዓት፡ 08:30 እስከ 18:00",
  "",
  "የተሰሩ ስራዎች",
  "± የማለዳ ምግብ አዘገጃጀትን ተከታትለናል፤ ገብጋቢ ችግር አልተገኘም።",
  "የፅዳት ቡድን በሁለቱም ቅርንጫፎች የተመጣጠነ ስራ ሰርቷል።",
  "የምሽት እራት ክፍል ሙሉ በሙሉ በሰው ተሸፍኖ ተዘግቷል።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "± የቦሌ ቅርንጫፍ የኩሽና ጋዝ ሲሊንደር መለኪያ በስራ ላይ አልነበረም፤ እንዲተካ ተዘጋጅቷል።",
  "የፒያሳ ቅርንጫፍ የመጸዳጃ ቱቦ መፍሰስ ጥገና ቀጥሎ ይጠናቀቃል።",
  "",
  "አጠቃላይ አስተያየት",
  "የቀኑ እንቅስቃሴ በአጠቃላይ ጥሩ ነበር፤ የጥገና ጉዳዮች በትኩረት ይታያሉ።",
].join("\n");

const latestFromRaw = (raw) => {
  const sections = [];
  const header = raw.slice(0, raw.indexOf("\n\n"));
  sections.push(
    `<p>${header.replace(/\n/g, "<br/>")}</p>`,
  );
  const body = raw.slice(raw.indexOf("\n\n") + 2);
  const blocks = body.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length > 1) {
      sections.push(`<p><strong>${lines[0]}</strong></p>`);
      lines.slice(1).forEach((line) => sections.push(`<p>${line}</p>`));
    } else if (lines.length === 1) {
      sections.push(`<p>${lines[0]}</p>`);
    }
  }
  return sections.join("\n");
};

const latestR001 = latestFromRaw(RAW_R001);

const RAW_R002 = [
  "ቀን፡ 10-08-26",
  "ብራንች፡ ሳርቤት ቅርንጫፍ",
  "ስም፡ ቤዛ አያሌው",
  "ሰዓት፡ 09:00 እስከ 17:30",
  "",
  "የተሰሩ ስራዎች",
  "± የቀኑን ምግብ አዘገጃጀት ከሼፍ ጋር ተመልክተናል።",
  "የእንግዶች አገልግሎት ከጠዋት እስከ ምሽት በስራ ላይ ነበር።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "የሳርቤት ቅርንጫፍ የበር መዝጊያ ጥገና ይፈልጋል።",
  "",
  "አጠቃላይ አስተያየት",
  "ሰራተኞቹ በትኩረት ሰርተዋል።",
].join("\n");

const latestR002 = latestFromRaw(RAW_R002);

const RAW_R003 = [
  "ቀን፡ 09-08-26",
  "ብራንች፡ ገርጂ ቅርንጫፍ / ካዛንቺስ ቅርንጫፍ",
  "ስም፡ ቤዛ አያሌው",
  "ሰዓት፡ 08:00 እስከ 18:30",
  "",
  "የተሰሩ ስራዎች",
  "± የቁሳቁስ መቀበያ እና ማከማቻን ተመልክተናል።",
  "የገርጂ ቅርንጫፍ የአዲስ ሰራተኞች ስልጠና ተጀምሯል።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "± የካዛንቺስ ቅርንጫፍ የኤሌክትሪክ መስመር ችግር በኤሌክትሪክ ባለሙያ እንዲታይ ተደርጓል።",
  "",
  "አጠቃላይ አስተያየት",
  "አብዛኛው ስራ በስርዓት ተከናውኗል።",
].join("\n");

const latestR003 = latestFromRaw(RAW_R003);

const RAW_R004 = [
  "ቀን፡ 08-08-26",
  "ብራንች፡ መካኒሳ ቅርንጫፍ",
  "ስም፡ ቤዛ አያሌው",
  "ሰዓት፡ 08:30 እስከ 17:00",
  "",
  "የተሰሩ ስራዎች",
  "± የጥዋት ሰዓት ምግብ ዝግጅት ተረጋግጧል።",
  "የፅዳት ስራዎች በትክክል ተከናውነዋል።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "ከመካኒሳ ቅርንጫፍ የውሃ ግፊት መቀነስ አስተውለናል።",
  "",
  "አጠቃላይ አስተያየት",
  "የቀኑ ሂደት ከሚጠበቀው በላይ ጥሩ ነበር።",
].join("\n");

const latestR004 = latestFromRaw(RAW_R004);

const RAW_R011 = [
  "ቀን፡ 25-07-26",
  "ብራንች፡ ቦሌ ቅርንጫፍ",
  "ስም፡ ቤዛ አያሌው",
  "ሰዓት፡ 09:00 እስከ 18:00",
  "",
  "የተሰሩ ስራዎች",
  "± የቀኑን እንቅስቃሴ ተመልክተናል።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "የመጋዘን ቁልፍ አስተዳደር ማሻሻያ ይፈልጋል።",
  "",
  "አጠቃላይ አስተያየት",
  "በአጠቃላይ የቀኑ ስራ ተመጣጣኝ ነበር።",
].join("\n");

const latestR011 = latestFromRaw(RAW_R011);

const RAW_R012 = [
  "ቀን፡ 11-08-26",
  "ብራንች፡ ጎፋ ቅርንጫፍ",
  "ስም፡ ሄኖክ ገነት",
  "ሰዓት፡ 08:00 እስከ 17:00",
  "",
  "የተሰሩ ስራዎች",
  "± የጎፋ ቅርንጫፍ የምሽት ስራ ሂደት ተመልክቷል።",
  "",
  "መፍትሄ የሚፈሉ ጉዳዮች",
  "የኩሽና መብራቶች መተካት ያስፈልጋቸዋል።",
  "",
  "አጠቃላይ አስተያየት",
  "ስራዎቹ በስርዓት ተከናውነዋል።",
].join("\n");

const latestR012 = latestFromRaw(RAW_R012);

/**
 * Report seeds (§21, §31): every status member present; Type-1 and
 * Type-2 days (§6.4); one archived report (tombstone walk); one
 * `reviewed` report whose digest has a non-empty `unassignedItems`
 * (the §31.6 accept-gate walk); one report of the BR-13 second
 * user (ownership scoping — never visible to the persona's pages).
 * @type {readonly Object[]}
 */
export const MOCK_REPORTS = deepFreeze([
  {
    _id: "r-0001",
    user: "mock-0001",
    reportDate: "2026-08-11T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "completed",
    branches: [
      { branch: "branch-0001", name: "ቦሌ ቅርንጫፍ" },
      { branch: "branch-0002", name: "ፒያሳ ቅርንጫፍ" },
    ],
    visits: [
      { visitNo: 1, branchName: "ቦሌ ቅርንጫፍ", clockIn: "08:30", clockOut: "13:00" },
      { visitNo: 2, branchName: "ፒያሳ ቅርንጫፍ", clockIn: "14:00", clockOut: "18:00" },
    ],
    raw: RAW_R001,
    latest: latestR001,
    branchDigest: {
      schemaVersion: 1,
      report: {
        type: "Type-2",
        visits: [
          { visitNo: 1, branchName: "ቦሌ ቅርንጫፍ", clockIn: "08:30", clockOut: "13:00" },
          { visitNo: 2, branchName: "ፒያሳ ቅርንጫፍ", clockIn: "14:00", clockOut: "18:00" },
        ],
      },
      branches: [
        {
          branchName: "ቦሌ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r001-01",
              text: "የማለዳ ምግብ አዘገጃጀትን ተከታትለናል፤ ገብጋቢ ችግር አልተገኘም።",
              status: "completed",
              sourceClip: "clip-0001",
              attributionBasis: "spoken",
            },
            {
              itemId: "d-r001-02",
              text: "የምሽት እራት ክፍል ሙሉ በሙሉ በሰው ተሸፍኖ ተዘግቷል።",
              status: "completed",
              sourceClip: "clip-0002",
              attributionBasis: "binding",
            },
          ],
          issues: [
            {
              itemId: "d-r001-03",
              text: "የኩሽና ጋዝ ሲሊንደር መለኪያ በስራ ላይ አልነበረም፤ እንዲተካ ተዘጋጅቷል።",
              status: "in_progress",
              sourceClip: "clip-0001",
              attributionBasis: "spoken",
            },
          ],
          comment: {
            text: "የቀኑ እንቅስቃሴ በአጠቃላይ ጥሩ ነበር።",
            rating: 4,
          },
        },
        {
          branchName: "ፒያሳ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r001-04",
              text: "የፅዳት ቡድን የተመጣጠነ ስራ ሰርቷል።",
              status: "completed",
              sourceClip: "clip-0003",
              attributionBasis: "binding",
            },
          ],
          issues: [
            {
              itemId: "d-r001-05",
              text: "የመጸዳጃ ቱቦ መፍሰስ ጥገና ቀጥሎ ይጠናቀቃል።",
              status: "reported",
              sourceClip: "clip-0003",
              attributionBasis: "binding",
            },
          ],
          comment: {
            text: "ሰራተኞቹ በትኩረት ሰርተዋል።",
            rating: 5,
          },
        },
      ],
      unassignedItems: [],
    },
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-11T07:00:00.000Z",
    updatedAt: "2026-08-11T19:00:00.000Z",
  },
  {
    _id: "r-0002",
    user: "mock-0001",
    reportDate: "2026-08-10T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "completed",
    branches: [{ branch: "branch-0003", name: "ሳርቤት ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ሳርቤት ቅርንጫፍ", clockIn: "09:00", clockOut: "17:30" },
    ],
    raw: RAW_R002,
    latest: latestR002,
    branchDigest: {
      schemaVersion: 1,
      report: {
        type: "Type-1",
        visits: [
          { visitNo: 1, branchName: "ሳርቤት ቅርንጫፍ", clockIn: "09:00", clockOut: "17:30" },
        ],
      },
      branches: [
        {
          branchName: "ሳርቤት ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r002-01",
              text: "የቀኑን ምግብ አዘገጃጀት ከሼፍ ጋር ተመልክተናል።",
              status: "completed",
              sourceClip: "clip-0004",
              attributionBasis: "single-branch-default",
            },
            {
              itemId: "d-r002-02",
              text: "የእንግዶች አገልግሎት በስራ ላይ ነበር።",
              status: "completed",
              sourceClip: "clip-0004",
              attributionBasis: "single-branch-default",
            },
          ],
          issues: [
            {
              itemId: "d-r002-03",
              text: "የበር መዝጊያ ጥገና ይፈልጋል።",
              status: "reported",
              sourceClip: "clip-0004",
              attributionBasis: "single-branch-default",
            },
          ],
          comment: { text: "ሰራተኞቹ በትኩረት ሰርተዋል።", rating: 4 },
        },
      ],
      unassignedItems: [],
    },
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-10T07:00:00.000Z",
    updatedAt: "2026-08-10T19:00:00.000Z",
  },
  {
    _id: "r-0003",
    user: "mock-0001",
    reportDate: "2026-08-09T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "reviewed",
    branches: [
      { branch: "branch-0004", name: "ገርጂ ቅርንጫፍ" },
      { branch: "branch-0005", name: "ካዛንቺስ ቅርንጫፍ" },
    ],
    visits: [
      { visitNo: 1, branchName: "ገርጂ ቅርንጫፍ", clockIn: "08:00", clockOut: "12:30" },
      { visitNo: 2, branchName: "ካዛንቺስ ቅርንጫፍ", clockIn: "13:30", clockOut: "18:30" },
    ],
    raw: RAW_R003,
    latest: latestR003,
    branchDigest: {
      schemaVersion: 1,
      report: {
        type: "Type-2",
        visits: [
          { visitNo: 1, branchName: "ገርጂ ቅርንጫፍ", clockIn: "08:00", clockOut: "12:30" },
          { visitNo: 2, branchName: "ካዛንቺስ ቅርንጫፍ", clockIn: "13:30", clockOut: "18:30" },
        ],
      },
      branches: [
        {
          branchName: "ገርጂ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r003-01",
              text: "የቁሳቁስ መቀበያ እና ማከማቻን ተመልክተናል።",
              status: "completed",
              sourceClip: "clip-0005",
              attributionBasis: "spoken",
            },
          ],
          issues: [],
          comment: { text: "አብዛኛው ስራ በስርዓት ተከናውኗል።", rating: 4 },
        },
        {
          branchName: "ካዛንቺስ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r003-02",
              text: "የአዲስ ሰራተኞች ስልጠና ተጀምሯል።",
              status: "in_progress",
              sourceClip: "clip-0007",
              attributionBasis: "binding",
            },
          ],
          issues: [
            {
              itemId: "d-r003-03",
              text: "የኤሌክትሪክ መስመር ችግር በባለሙያ እንዲታይ ተደርጓል።",
              status: "reported",
              sourceClip: "clip-0007",
              attributionBasis: "binding",
            },
          ],
          comment: { text: "ስራዎቹ በስርዓት ተከናውነዋል።", rating: 3 },
        },
      ],
      unassignedItems: [
        {
          itemId: "d-r003-04",
          text: "የገርጂ ቅርንጫፍ የእራት ክፍል የሰው ኃይል ማሟያ ቀጥሎ ይታያል።",
          status: "reported",
          sourceClip: "clip-0006",
          attributionBasis: "unassigned",
        },
      ],
    },
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-09T07:00:00.000Z",
    updatedAt: "2026-08-09T19:00:00.000Z",
  },
  {
    _id: "r-0004",
    user: "mock-0001",
    reportDate: "2026-08-08T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "reviewed",
    branches: [{ branch: "branch-0006", name: "መካኒሳ ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "መካኒሳ ቅርንጫፍ", clockIn: "08:30", clockOut: "17:00" },
    ],
    raw: RAW_R004,
    latest: latestR004,
    branchDigest: {
      schemaVersion: 1,
      report: {
        type: "Type-1",
        visits: [
          { visitNo: 1, branchName: "መካኒሳ ቅርንጫፍ", clockIn: "08:30", clockOut: "17:00" },
        ],
      },
      branches: [
        {
          branchName: "መካኒሳ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r004-01",
              text: "የጥዋት ሰዓት ምግብ ዝግጅት ተረጋግጧል።",
              status: "completed",
              sourceClip: "clip-0008",
              attributionBasis: "single-branch-default",
            },
            {
              itemId: "d-r004-02",
              text: "የፅዳት ስራዎች በትክክል ተከናውነዋል።",
              status: "completed",
              sourceClip: "clip-0008",
              attributionBasis: "single-branch-default",
            },
          ],
          issues: [
            {
              itemId: "d-r004-03",
              text: "የውሃ ግፊት መቀነስ አስተውለናል።",
              status: "reported",
              sourceClip: "clip-0008",
              attributionBasis: "single-branch-default",
            },
          ],
          comment: { text: "የቀኑ ሂደት ጥሩ ነበር።", rating: 4 },
        },
      ],
      unassignedItems: [],
    },
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-08T07:00:00.000Z",
    updatedAt: "2026-08-08T19:00:00.000Z",
  },
  {
    _id: "r-0005",
    user: "mock-0001",
    reportDate: "2026-08-06T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "transcribed",
    branches: [
      { branch: "branch-0007", name: "ጎፋ ቅርንጫፍ" },
      { branch: "branch-0001", name: "ቦሌ ቅርንጫፍ" },
    ],
    visits: [
      { visitNo: 1, branchName: "ጎፋ ቅርንጫፍ", clockIn: "08:00", clockOut: "12:00" },
      { visitNo: 2, branchName: "ቦሌ ቅርንጫፍ", clockIn: "13:00", clockOut: "18:00" },
    ],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-06T07:00:00.000Z",
    updatedAt: "2026-08-06T19:00:00.000Z",
  },
  {
    _id: "r-0006",
    user: "mock-0001",
    reportDate: "2026-08-05T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "transcribed",
    branches: [{ branch: "branch-0002", name: "ፒያሳ ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ፒያሳ ቅርንጫፍ", clockIn: "09:00", clockOut: "18:00" },
    ],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-05T07:00:00.000Z",
    updatedAt: "2026-08-05T19:00:00.000Z",
  },
  {
    _id: "r-0007",
    user: "mock-0001",
    reportDate: "2026-08-04T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "audio_attached",
    branches: [{ branch: "branch-0003", name: "ሳርቤት ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ሳርቤት ቅርንጫፍ", clockIn: "08:30", clockOut: "17:30" },
    ],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-04T07:00:00.000Z",
    updatedAt: "2026-08-04T19:00:00.000Z",
  },
  {
    _id: "r-0008",
    user: "mock-0001",
    reportDate: "2026-08-03T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "audio_attached",
    branches: [
      { branch: "branch-0004", name: "ገርጂ ቅርንጫፍ" },
      { branch: "branch-0005", name: "ካዛንቺስ ቅርንጫፍ" },
    ],
    visits: [
      { visitNo: 1, branchName: "ገርጂ ቅርንጫፍ", clockIn: "08:00", clockOut: "13:00" },
      { visitNo: 2, branchName: "ካዛንቺስ ቅርንጫፍ", clockIn: "14:00", clockOut: "18:30" },
    ],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-03T07:00:00.000Z",
    updatedAt: "2026-08-03T19:00:00.000Z",
  },
  {
    _id: "r-0009",
    user: "mock-0001",
    reportDate: null,
    supervisorName: "Beza Ayalew",
    status: "draft",
    branches: [],
    visits: [],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-12T07:00:00.000Z",
    updatedAt: "2026-08-12T07:00:00.000Z",
  },
  {
    _id: "r-0010",
    user: "mock-0001",
    reportDate: "2026-07-30T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "draft",
    branches: [{ branch: "branch-0001", name: "ቦሌ ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ቦሌ ቅርንጫፍ", clockIn: "09:00", clockOut: "17:00" },
    ],
    raw: null,
    latest: null,
    branchDigest: null,
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-07-30T07:00:00.000Z",
    updatedAt: "2026-07-30T07:00:00.000Z",
  },
  {
    _id: "r-0011",
    user: "mock-0001",
    reportDate: "2026-07-25T00:00:00.000Z",
    supervisorName: "Beza Ayalew",
    status: "completed",
    branches: [{ branch: "branch-0001", name: "ቦሌ ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ቦሌ ቅርንጫፍ", clockIn: "09:00", clockOut: "18:00" },
    ],
    raw: RAW_R011,
    latest: latestR011,
    branchDigest: null,
    isArchived: true,
    archivedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-07-25T07:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
  {
    _id: "r-0012",
    user: "mock-0002",
    reportDate: "2026-08-11T00:00:00.000Z",
    supervisorName: "Henok Getnet",
    status: "completed",
    branches: [{ branch: "branch-0007", name: "ጎፋ ቅርንጫፍ" }],
    visits: [
      { visitNo: 1, branchName: "ጎፋ ቅርንጫፍ", clockIn: "08:00", clockOut: "17:00" },
    ],
    raw: RAW_R012,
    latest: latestR012,
    branchDigest: {
      schemaVersion: 1,
      report: {
        type: "Type-1",
        visits: [
          { visitNo: 1, branchName: "ጎፋ ቅርንጫፍ", clockIn: "08:00", clockOut: "17:00" },
        ],
      },
      branches: [
        {
          branchName: "ጎፋ ቅርንጫፍ",
          activities: [
            {
              itemId: "d-r012-01",
              text: "የምሽት ስራ ሂደት ተመልክቷል።",
              status: "completed",
              sourceClip: "clip-0021",
              attributionBasis: "single-branch-default",
            },
          ],
          issues: [
            {
              itemId: "d-r012-02",
              text: "የኩሽና መብራቶች መተካት ያስፈልጋቸዋል።",
              status: "reported",
              sourceClip: "clip-0021",
              attributionBasis: "single-branch-default",
            },
          ],
          comment: { text: "ስራዎቹ በስርዓት ተከናውነዋል።", rating: 4 },
        },
      ],
      unassignedItems: [],
    },
    isArchived: false,
    archivedAt: null,
    createdAt: "2026-08-11T07:00:00.000Z",
    updatedAt: "2026-08-11T19:00:00.000Z",
  },
]);

const iso = (daysAgo, hour = 9) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

/**
 * Clip seeds (§22): bound `{ report, visitNo }`; metadata-only
 * surface (§22.7 — no `filePath`); `transcription` ref set only for
 * clips whose transcription exists. Clip ids double as the digest
 * `sourceClip` refs.
 * @type {readonly Object[]}
 */
export const MOCK_CLIPS = deepFreeze([
  { _id: "clip-0001", user: "mock-0001", report: "r-0001", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 5242880, durationSec: 287, transcription: "tr-0001", createdAt: "2026-08-11T07:10:00.000Z", updatedAt: "2026-08-11T07:10:00.000Z" },
  { _id: "clip-0002", user: "mock-0001", report: "r-0001", visitNo: 1, mimeType: "audio/wav", sizeBytes: 3145728, durationSec: 152, transcription: "tr-0002", createdAt: "2026-08-11T08:30:00.000Z", updatedAt: "2026-08-11T08:30:00.000Z" },
  { _id: "clip-0003", user: "mock-0001", report: "r-0001", visitNo: 2, mimeType: "audio/mpeg", sizeBytes: 8388608, durationSec: 421, transcription: "tr-0003", createdAt: "2026-08-11T14:10:00.000Z", updatedAt: "2026-08-11T14:10:00.000Z" },
  { _id: "clip-0004", user: "mock-0001", report: "r-0002", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 4194304, durationSec: 198, transcription: "tr-0004", createdAt: "2026-08-10T09:10:00.000Z", updatedAt: "2026-08-10T09:10:00.000Z" },
  { _id: "clip-0005", user: "mock-0001", report: "r-0003", visitNo: 1, mimeType: "audio/mp4", sizeBytes: 6291456, durationSec: 240, transcription: "tr-0005", createdAt: "2026-08-09T08:10:00.000Z", updatedAt: "2026-08-09T08:10:00.000Z" },
  { _id: "clip-0006", user: "mock-0001", report: "r-0003", visitNo: 1, mimeType: "audio/webm", sizeBytes: 2097152, durationSec: 95, transcription: "tr-0006", createdAt: "2026-08-09T09:00:00.000Z", updatedAt: "2026-08-09T09:00:00.000Z" },
  { _id: "clip-0007", user: "mock-0001", report: "r-0003", visitNo: 2, mimeType: "audio/mpeg", sizeBytes: 9437184, durationSec: 480, transcription: "tr-0007", createdAt: "2026-08-09T13:40:00.000Z", updatedAt: "2026-08-09T13:40:00.000Z" },
  { _id: "clip-0008", user: "mock-0001", report: "r-0004", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 3670016, durationSec: 178, transcription: "tr-0008", createdAt: "2026-08-08T08:40:00.000Z", updatedAt: "2026-08-08T08:40:00.000Z" },
  { _id: "clip-0009", user: "mock-0001", report: "r-0005", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 5242880, durationSec: 256, transcription: "tr-0009", createdAt: "2026-08-06T08:10:00.000Z", updatedAt: "2026-08-06T08:10:00.000Z" },
  { _id: "clip-0010", user: "mock-0001", report: "r-0005", visitNo: 2, mimeType: "audio/wav", sizeBytes: 7340032, durationSec: 310, transcription: "tr-0010", createdAt: "2026-08-06T13:10:00.000Z", updatedAt: "2026-08-06T13:10:00.000Z" },
  { _id: "clip-0011", user: "mock-0001", report: "r-0006", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 3145728, durationSec: 148, transcription: "tr-0011", createdAt: "2026-08-05T09:10:00.000Z", updatedAt: "2026-08-05T09:10:00.000Z" },
  { _id: "clip-0012", user: "mock-0001", report: "r-0007", visitNo: 1, mimeType: "audio/mp4", sizeBytes: 10485760, durationSec: 540, transcription: null, createdAt: "2026-08-04T08:40:00.000Z", updatedAt: "2026-08-04T08:40:00.000Z" },
  { _id: "clip-0013", user: "mock-0001", report: "r-0007", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 2097152, durationSec: 88, transcription: null, createdAt: "2026-08-04T10:00:00.000Z", updatedAt: "2026-08-04T10:00:00.000Z" },
  { _id: "clip-0014", user: "mock-0001", report: "r-0008", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 4194304, durationSec: 205, transcription: null, createdAt: "2026-08-03T08:10:00.000Z", updatedAt: "2026-08-03T08:10:00.000Z" },
  { _id: "clip-0015", user: "mock-0001", report: "r-0008", visitNo: 1, mimeType: "audio/webm", sizeBytes: 1572864, durationSec: 74, transcription: null, createdAt: "2026-08-03T09:30:00.000Z", updatedAt: "2026-08-03T09:30:00.000Z" },
  { _id: "clip-0016", user: "mock-0001", report: "r-0008", visitNo: 2, mimeType: "audio/mpeg", sizeBytes: 8388608, durationSec: 398, transcription: null, createdAt: "2026-08-03T14:10:00.000Z", updatedAt: "2026-08-03T14:10:00.000Z" },
  { _id: "clip-0017", user: "mock-0001", report: "r-0010", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 2621440, durationSec: 122, transcription: null, createdAt: "2026-07-30T09:10:00.000Z", updatedAt: "2026-07-30T09:10:00.000Z" },
  { _id: "clip-0018", user: "mock-0001", report: "r-0011", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 3145728, durationSec: 165, transcription: "tr-0012", createdAt: "2026-07-25T09:10:00.000Z", updatedAt: "2026-07-25T09:10:00.000Z" },
  { _id: "clip-0019", user: "mock-0002", report: "r-0012", visitNo: 1, mimeType: "audio/mpeg", sizeBytes: 4194304, durationSec: 210, transcription: "tr-0013", createdAt: "2026-08-11T08:10:00.000Z", updatedAt: "2026-08-11T08:10:00.000Z" },
  { _id: "clip-0020", user: "mock-0002", report: "r-0012", visitNo: 1, mimeType: "audio/wav", sizeBytes: 2097152, durationSec: 96, transcription: "tr-0014", createdAt: "2026-08-11T09:30:00.000Z", updatedAt: "2026-08-11T09:30:00.000Z" },
]);

/**
 * Transcription seeds (§23): per-clip `raw`/`latest` single-undo
 * (BR-11); `tr-0003` has a differing pair — the §51.4 "Restore
 * original" walk. Content is fixture Amharic (§33 pipeline output
 * shape; `stt.*` audit only, ADR-019).
 * @type {readonly Object[]}
 */
export const MOCK_TRANSCRIPTIONS = deepFreeze([
  { _id: "tr-0001", user: "mock-0001", audio: "clip-0001", raw: "የማለዳ ምግብ አዘገጃጀትን ተከታትለናል፤ ገብጋቢ ችግር አልተገኘም። የኩሽና ጋዝ ሲሊንደር መለኪያ በስራ ላይ አልነበረም፤ እንዲተካ ተዘጋጅቷል።", latest: "የማለዳ ምግብ አዘገጃጀትን ተከታትለናል፤ ገብጋቢ ችግር አልተገኘም። የኩሽና ጋዝ ሲሊንደር መለኪያ በስራ ላይ አልነበረም፤ እንዲተካ ተዘጋጅቷል።", language: "am", stt: { requestId: "req-0001", model: "addis-stt-1" }, createdAt: iso(1), updatedAt: iso(1) },
  { _id: "tr-0002", user: "mock-0001", audio: "clip-0002", raw: "የፅዳት ቡድን በሁለቱም ቅርንጫፎች የተመጣጠነ ስራ ሰርቷል።", latest: "የፅዳት ቡድን በሁለቱም ቅርንጫፎች የተመጣጠነ ስራ ሰርቷል።", language: "am", stt: { requestId: "req-0002", model: "addis-stt-1" }, createdAt: iso(1), updatedAt: iso(1) },
  { _id: "tr-0003", user: "mock-0001", audio: "clip-0003", raw: "የምሽት እራት ክፍል ሙሉ በሙሉ በሰው ተሸፍኖ ተዘግቷል። የመጸዳጃ ቱቦ መፍሰስ ጥገና ቀጥሎ ይጠናቀቃል።", latest: "የምሽት እራት ክፍል በሰው ተሸፍኖ ተዘግቷል።", language: "am", stt: { requestId: "req-0003", model: "addis-stt-1" }, createdAt: iso(1), updatedAt: iso(1) },
  { _id: "tr-0004", user: "mock-0001", audio: "clip-0004", raw: "የቀኑን ምግብ አዘገጃጀት ከሼፍ ጋር ተመልክተናል። የእንግዶች አገልግሎት በስራ ላይ ነበር።", latest: "የቀኑን ምግብ አዘገጃጀት ከሼፍ ጋር ተመልክተናል። የእንግዶች አገልግሎት በስራ ላይ ነበር።", language: "am", stt: { requestId: "req-0004", model: "addis-stt-1" }, createdAt: iso(2), updatedAt: iso(2) },
  { _id: "tr-0005", user: "mock-0001", audio: "clip-0005", raw: "የቁሳቁስ መቀበያ እና ማከማቻን ተመልክተናል።", latest: "የቁሳቁስ መቀበያ እና ማከማቻን ተመልክተናል።", language: "am", stt: { requestId: "req-0005", model: "addis-stt-1" }, createdAt: iso(3), updatedAt: iso(3) },
  { _id: "tr-0006", user: "mock-0001", audio: "clip-0006", raw: "የገርጂ ቅርንጫፍ የእራት ክፍል የሰው ኃይል ማሟያ ቀጥሎ ይታያል።", latest: "የገርጂ ቅርንጫፍ የእራት ክፍል የሰው ኃይል ማሟያ ቀጥሎ ይታያል።", language: "am", stt: { requestId: "req-0006", model: "addis-stt-1" }, createdAt: iso(3), updatedAt: iso(3) },
  { _id: "tr-0007", user: "mock-0001", audio: "clip-0007", raw: "የካዛንቺስ ቅርንጫፍ የኤሌክትሪክ መስመር ችግር በኤሌክትሪክ ባለሙያ እንዲታይ ተደርጓል። የአዲስ ሰራተኞች ስልጠና ተጀምሯል።", latest: "የካዛንቺስ ቅርንጫፍ የኤሌክትሪክ መስመር ችግር በኤሌክትሪክ ባለሙያ እንዲታይ ተደርጓል። የአዲስ ሰራተኞች ስልጠና ተጀምሯል።", language: "am", stt: { requestId: "req-0007", model: "addis-stt-1" }, createdAt: iso(3), updatedAt: iso(3) },
  { _id: "tr-0008", user: "mock-0001", audio: "clip-0008", raw: "የጥዋት ሰዓት ምግብ ዝግጅት ተረጋግጧል። የፅዳት ስራዎች በትክክል ተከናውነዋል። የውሃ ግፊት መቀነስ አስተውለናል።", latest: "የጥዋት ሰዓት ምግብ ዝግጅት ተረጋግጧል። የፅዳት ስራዎች በትክክል ተከናውነዋል። የውሃ ግፊት መቀነስ አስተውለናል።", language: "am", stt: { requestId: "req-0008", model: "addis-stt-1" }, createdAt: iso(4), updatedAt: iso(4) },
  { _id: "tr-0009", user: "mock-0001", audio: "clip-0009", raw: "የጎፋ ቅርንጫፍ የጥዋት ስራ ሂደት ተመልክቷል።", latest: "የጎፋ ቅርንጫፍ የጥዋት ስራ ሂደት ተመልክቷል።", language: "am", stt: { requestId: "req-0009", model: "addis-stt-1" }, createdAt: iso(6), updatedAt: iso(6) },
  { _id: "tr-0010", user: "mock-0001", audio: "clip-0010", raw: "የቦሌ ቅርንጫፍ የእራት ክፍል ዝግጅት ተረጋግጧል።", latest: "የቦሌ ቅርንጫፍ የእራት ክፍል ዝግጅት ተረጋግጧል።", language: "am", stt: { requestId: "req-0010", model: "addis-stt-1" }, createdAt: iso(6), updatedAt: iso(6) },
  { _id: "tr-0011", user: "mock-0001", audio: "clip-0011", raw: "የፒያሳ ቅርንጫፍ የቀኑ ሂደት ተመልክቷል።", latest: "የፒያሳ ቅርንጫፍ የቀኑ ሂደት ተመልክቷል።", language: "am", stt: { requestId: "req-0011", model: "addis-stt-1" }, createdAt: iso(7), updatedAt: iso(7) },
  { _id: "tr-0012", user: "mock-0001", audio: "clip-0018", raw: "የቀኑን እንቅስቃሴ ተመልክተናል። የመጋዘን ቁልፍ አስተዳደር ማሻሻያ ይፈልጋል።", latest: "የቀኑን እንቅስቃሴ ተመልክተናል። የመጋዘን ቁልፍ አስተዳደር ማሻሻያ ይፈልጋል።", language: "am", stt: { requestId: "req-0012", model: "addis-stt-1" }, createdAt: iso(18), updatedAt: iso(18) },
  { _id: "tr-0013", user: "mock-0002", audio: "clip-0019", raw: "የምሽት ስራ ሂደት ተመልክቷል።", latest: "የምሽት ስራ ሂደት ተመልክቷል።", language: "am", stt: { requestId: "req-0013", model: "addis-stt-1" }, createdAt: iso(1), updatedAt: iso(1) },
  { _id: "tr-0014", user: "mock-0002", audio: "clip-0020", raw: "የኩሽና መብራቶች መተካት ያስፈልጋቸዋል።", latest: "የኩሽና መብራቶች መተካት ያስፈልጋቸዋል።", language: "am", stt: { requestId: "req-0014", model: "addis-stt-1" }, createdAt: iso(1), updatedAt: iso(1) },
]);

/**
 * Conversation seeds (§24/§36): one thread for r-0001 (roles
 * `system`/`user`/`assistant`, §11.4 `MESSAGE_ROLES`; assistant
 * content is HTML-rich — the client sanitizes before render, §61).
 * Reports without a thread answer `{ messages: [] }` (§36.2).
 * @type {readonly Object[]}
 */
export const MOCK_CONVERSATIONS = deepFreeze([
  {
    _id: "conv-0001",
    user: "mock-0001",
    report: "r-0001",
    messages: [
      {
        role: "system",
        content: "Correction chat for ቀን፡ 11-08-26.",
        provider: null,
        model: null,
        reasoning: null,
        createdAt: "2026-08-11T19:30:00.000Z",
      },
      {
        role: "user",
        content: "የቦሌ ቅርንጫፍ ክፍል ላይ የተደጋገመ ግስ አስወግድ።",
        provider: null,
        model: null,
        reasoning: null,
        createdAt: "2026-08-11T19:31:00.000Z",
      },
      {
        role: "assistant",
        content:
          "<p>ተስተካክሏል — <strong>removed duplicate verb</strong> in the የተሰሩ ስራዎች section.</p><p>± tokens are untouched.</p>",
        provider: "addis",
        model: "Addis-፩-አሌፍ",
        reasoning: null,
        createdAt: "2026-08-11T19:31:45.000Z",
      },
    ],
    createdAt: "2026-08-11T19:30:00.000Z",
    updatedAt: "2026-08-11T19:31:45.000Z",
  },
  {
    _id: "conv-0002",
    user: "mock-0001",
    report: "r-0004",
    messages: [
      {
        role: "user",
        content: "አጠቃላይ አስተያየትን አሻሽል።",
        provider: null,
        model: null,
        reasoning: null,
        createdAt: "2026-08-08T19:20:00.000Z",
      },
      {
        role: "assistant",
        content: "<p>የአጠቃላይ አስተያየት ክፍል <strong>moved case FE paragraph</strong>.</p>",
        provider: "gemini",
        model: "gemini-3.1-flash-lite",
        reasoning: null,
        createdAt: "2026-08-08T19:20:40.000Z",
      },
    ],
    createdAt: "2026-08-08T19:20:00.000Z",
    updatedAt: "2026-08-08T19:20:40.000Z",
  },
]);

/**
 * Session-list seeds (§28.3 token bookkeeping): fixed rows plus the
 * live session — the transport marks the active session row
 * `isCurrent` (§57.4 "This session").
 * @type {readonly Object[]}
 */
export const MOCK_SESSIONS = deepFreeze([
  {
    _id: "ses-0001",
    user: "mock-0001",
    device: "Chrome on Windows",
    issuedAt: iso(1, 8),
    lastUsedAt: iso(0, 9),
  },
  {
    _id: "ses-0002",
    user: "mock-0001",
    device: "Chrome on Android",
    issuedAt: iso(10, 20),
    lastUsedAt: iso(9, 12),
  },
]);
