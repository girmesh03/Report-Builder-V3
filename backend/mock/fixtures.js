/**
 * @module mock/fixtures
 *
 * The canonical §25.3 development fixture set — versioned with the
 * §40 seed (registered in §69, D41–D52): the deterministic
 * vocabulary that both the seed and the wipe share. Every rule of
 * §25.2 holds: no privacy data (the §6.8 persona + the §6.8 branch
 * names only), sample report bodies **verbatim from the §6.8
 * samples**, Amharic content surfaces, metadata-only audio with the
 * synthetic `mock/` path convention (never a physical file,
 * ADR-037), register-valid conversation triples, and the §17.6
 * presence-valid state per report status.
 *
 * Sample→fixture mapping (D51): Sample 3 (Type-1) → the transcribed
 * fixture's body; Sample 1 (Type-2, two branches) → the
 * audio_attached fixture's day shape; Sample 2 (Type-2, three
 * branches — all ACTIVE in the seeded set) → the generated fixture's
 * day + body; Sample 4's day revisits ጎላጉል — archived in the
 * fixture set (the §31.2 create path refuses archived visit
 * branches) — so it has no representable slot and stays the §6.8
 * reference only. The draft fixture is capture-only (no body — its
 * status has no content surface, §17.6).
 */
import { ethiopianToGregorian } from '../utils/ethiopianDate.js';
import {
  AI_MODELS,
  AI_REASONING_DEFAULT,
  AI_REASONING_EFFORTS,
  ITEM_STATUSES,
  ITEM_TYPES,
  LANGUAGE_CODES,
  MESSAGE_ROLES,
  REPORT_STATUSES,
} from '../utils/constants.js';

/**
 * The §6.8 sample dates as stored Dates — `ethiopianToGregorian`
 * returns the calendar components; the report `date` field stores a
 * Date (the midnight-UTC convention, §38.5).
 * @param {{day: number, month: number, year: number}} eth - The Ethiopian calendar date.
 * @returns {Date} The stored Date (00:00Z of the Gregorian day).
 */
function sampleDate(eth) {
  return new Date(Date.UTC(eth.year, eth.month - 1, eth.day));
}

/** The §25 mock-path convention — synthetic audio paths, never real files. */
export const MOCK_PATH_PREFIX = 'mock/';

/** The §40.2 user fixtures — dev-only accounts that can never authenticate. */
export const MOCK_USERS = Object.freeze([
  {
    email: 'beza@mock.local',
    firstName: 'ቤዛ',
    lastName: 'አያሌው',
    // Dev-only placeholder password material — a hash of a random
    // string; the accounts can never authenticate (§40.2).
    password: `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  },
  {
    email: 'second@mock.local',
    firstName: 'ሁለተኛ',
    lastName: 'ተጠቃሚ',
    password: `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  },
]);

/** The §40.2 branch fixtures — 3 active + 1 archived (§6.8 names). */
export const MOCK_BRANCHES = Object.freeze([
  { name: 'መድኃኒዓለም', location: 'Mexico Square', isArchived: false },
  { name: 'ኤርፖርት', location: 'Airport', isArchived: false },
  { name: 'ቡልቡላ', location: 'Bulbula', isArchived: false },
  { name: 'ጎላጉል', location: 'Golagul', isArchived: true },
]);

/** The D45 BR-13 probe branch — the second mock account's minimal ownership scope. */
export const PROBE_BRANCH = Object.freeze({ name: 'ብስራተ ገብርኤል', location: 'Bishoftu', isArchived: false });

/**
 * The §6.8 sample bodies (verbatim) — the seeded `raw`/`latest`
 * content. Sample 2 (the generated fixture's day, three active
 * branches) and Sample 3 (the Type-1 day).
 */
export const SAMPLE_2_BODY = [
  'ቀን: 26-10-18',
  'ብራንች: ኤርፖርት / መድኃኒዓለም / ቡልቡላ',
  'ስም: ቤዛ አያሌው',
  'ስራ የገባሁበት ሰዓት:',
  'ከ01:50 - 04:10 ኤርፖርት ብራንች',
  'ከ04:20 - 07:30 መድኃኔዓለም ብራንች',
  'ከ08:05 - 12:30 ቡልቡላ ብራንች',
  '',
  'የተሰሩ ስራዎች:',
  'በኤርፖርትና በመድኃኒዓለም ብራንቾች በቼክሊስቱ መሠረት የዕለት ተዕለት የአሠራር ሂደቶችን፣ የንፅህና ሁኔታዎችን እና የሠራተኞችን ዝግጁነት አረጋግጫለሁ።',
  'በቡልቡላ ብራንች በተዘጋጀው የካሸሮች ሥልጠና ላይ ተሳትፌያለሁ።',
  '',
  'መፍትሄ የሚፈሉ ጉዳዮች:',
  'ለሳምቡሳ ዝግጅት የሚያስፈልጉ ግብዓቶች ስቶር ባለመኖራቸው፣ ወደ ብራንቹ ሳምቡሳ አልተላከም። ስለዚህ በተቻለ ፍጥነት ግብዓቶቹ እንዲሟሉ እጠይቃለሁ።',
  'በመድኃኒዓለም ብራንች የግሪሉ ግማሽ ክፍል አይሠራም። በመሆኑም ማቲያስ በተቻለ ፍጥነት እንዲጠግነው ጥሪ አድርጌ ነበር፤ ነገር ግን ሥራ እንደበዛበት አስታውቆኛል፣ ቢሆንም አሁንም እንዲስተካከል እጠይቃለሁ።',
  '',
  'አጠቃላይ አስተያየት:',
  'በአጠቃላይ በሦስቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።',
  '',
  'ከስራ የወጣሁበት ሰዓት: 12:30',
].join('\n');

export const SAMPLE_3_BODY = [
  'ቀን: 22-10-18',
  'ብራንች: መድኃኒዓለም',
  'ስም: ቤዛ አያሌው',
  'ስራ የገባሁበት ሰዓት: 01:55',
  '',
  'የተሰሩ ስራዎች:',
  'በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶች፣ የንፅህና አጠባበቅ ሁኔታ እና የሰራተኞች ዝግጁነት በተገቢው መልኩ መሆናቸውን አረጋግጫለሁ።',
  'ኤፍሬም በህመም እረፍት ላይ ስለነበር የእሱን የሥራ ቦታ ሸፍኜያለሁ።',
  '',
  'መፍትሄ የሚፈሉ ጉዳዮች:',
  'በዋናው መግቢያ በር ላይ የሚቀመጠው ምንጣፍ (ካርፔት) እንዲገዛልን ቀደም ሲል ጠይቄ የነበረ ሲሆን አሁንም በተቻለ ፍጥነት እንዲሟላልን እጠይቃለሁ።',
  '',
  'አጠቃላይ አስተያየት:',
  'በአጠቃላይ የሥራ እንቅስቃሴው ጥሩ ነበር።',
  '',
  'ከስራ የወጣሁበት ሰዓት: 09:30',
].join('\n');

/** Sample-1 day shape (Type-2, two branches) — the audio_attached fixture. */
export const SAMPLE_1_DAY = Object.freeze({
  date: sampleDate(ethiopianToGregorian({ day: 29, month: 10, year: 2018 })),
  clockIn: '02:30',
  clockOut: '12:20',
  visits: [
    { branch: 'መድኃኒዓለም', clockIn: '02:30', clockOut: '07:40' },
    { branch: 'ኤርፖርት', clockIn: '07:55', clockOut: '12:20' },
  ],
});

/** Sample-2 day shape (Type-2, three branches) — the generated fixture. */
export const SAMPLE_2_DAY = Object.freeze({
  date: sampleDate(ethiopianToGregorian({ day: 26, month: 10, year: 2018 })),
  clockIn: '01:50',
  clockOut: '12:30',
  visits: [
    { branch: 'ኤርፖርት', clockIn: '01:50', clockOut: '04:10' },
    { branch: 'መድኃኒዓለም', clockIn: '04:20', clockOut: '07:30' },
    { branch: 'ቡልቡላ', clockIn: '08:05', clockOut: '12:30' },
  ],
});

/** Sample-3 day shape (Type-1, single branch) — the transcribed fixture. */
export const SAMPLE_3_DAY = Object.freeze({
  date: sampleDate(ethiopianToGregorian({ day: 22, month: 10, year: 2018 })),
  clockIn: '01:55',
  clockOut: '09:30',
  visits: [
    { branch: 'መድኃኒዓለም', clockIn: '01:55', clockOut: '09:30' },
  ],
});

/**
 * The draft fixture — capture-only (date + clock pair on the main
 * branch; no visits beyond the main entry, §31.2-1). Its date is
 * its own sample-vocabulary day (distinct from the transcribed
 * fixture's, so the D41 signature stays one-report-per-date).
 */
export const DRAFT_DAY = Object.freeze({
  date: sampleDate(ethiopianToGregorian({ day: 20, month: 10, year: 2018 })),
  clockIn: '08:30',
  clockOut: '17:30',
  visits: [{ branch: 'መድኃኒዓለም', clockIn: '08:30', clockOut: '17:30' }],
});

/** Sample-4 day shape (Type-2, branch revisited) — the D45/D52 probe report's day (the seed's second-account scope). */
export const PROBE_DAY = Object.freeze({
  date: sampleDate(ethiopianToGregorian({ day: 9, month: 11, year: 2018 })),
  clockIn: '01:05',
  clockOut: '12:00',
  visits: [{ branch: 'ብስራተ ገብርኤል', clockIn: '01:05', clockOut: '12:00' }],
});

/** The §40.2 metadata-only audio fixtures (no physical files — ADR-037). */
export const MOCK_AUDIOS = Object.freeze([
  // The audio_attached report — 3 clips.
  { reportStatus: REPORT_STATUSES[1], mimeType: 'audio/webm', sizeBytes: 1245184, durationSec: 187, suffix: 'attached-1' },
  { reportStatus: REPORT_STATUSES[1], mimeType: 'audio/webm', sizeBytes: 882940, durationSec: 132, suffix: 'attached-2' },
  { reportStatus: REPORT_STATUSES[1], mimeType: 'audio/webm', sizeBytes: 1450204, durationSec: 201, suffix: 'attached-3' },
  // The transcribed report — 1 clip.
  { reportStatus: REPORT_STATUSES[2], mimeType: 'audio/webm', sizeBytes: 992612, durationSec: 149, suffix: 'transcribed-1' },
  // The generated report — 2 clips.
  { reportStatus: REPORT_STATUSES[3], mimeType: 'audio/webm', sizeBytes: 1101520, durationSec: 165, suffix: 'generated-1' },
  { reportStatus: REPORT_STATUSES[3], mimeType: 'audio/webm', sizeBytes: 781048, durationSec: 118, suffix: 'generated-2' },
]);

/**
 * The §40.2 Item fixtures (12 on the generated report) — texts drawn
 * from the Sample-2 body's own sentences (verbatim §6.8 vocabulary,
 * §25.2 rule 6), statuses per `ITEM_STATUSES_BY_TYPE` (§24A).
 */
export const MOCK_ITEMS = Object.freeze([
  { type: ITEM_TYPES[0], text: 'በኤርፖርትና በመድኃኒዓለም ብራንቾች በቼክሊስቱ መሠረት የዕለት ተዕለት የአሠራር ሂደቶችን አረጋግጫለሁ።', status: ITEM_STATUSES[2] },
  { type: ITEM_TYPES[0], text: 'የንፅህና ሁኔታዎችን አረጋግጫለሁ።', status: ITEM_STATUSES[2] },
  { type: ITEM_TYPES[0], text: 'የሠራተኞችን ዝግጁነት አረጋግጫለሁ።', status: ITEM_STATUSES[2] },
  { type: ITEM_TYPES[0], text: 'በቡልቡላ ብራንች በተዘጋጀው የካሸሮች ሥልጠና ላይ ተሳትፌያለሁ።', status: ITEM_STATUSES[2] },
  { type: ITEM_TYPES[0], text: 'የቀኑን የአሠራር ሂደት ተከታትያለሁ።', status: ITEM_STATUSES[1] },
  { type: ITEM_TYPES[0], text: 'የሰራተኞችን የተለያዩ ጥያቄዎች መልሻለሁ።', status: ITEM_STATUSES[1] },
  { type: ITEM_TYPES[0], text: 'የአሠራር ሂደቶችን በአግባቡ መከናወናቸውን አረጋግጫለሁ።', status: ITEM_STATUSES[2] },
  { type: ITEM_TYPES[1], text: 'ለሳምቡሳ ዝግጅት የሚያስፈልጉ ግብዓቶች ስቶር ባለመኖራቸው ወደ ብራንቹ ሳምቡሳ አልተላከም።', status: ITEM_STATUSES[0] },
  { type: ITEM_TYPES[1], text: 'በመድኃኒዓለም ብራንች የግሪሉ ግማሽ ክፍል አይሠራም።', status: ITEM_STATUSES[0] },
  { type: ITEM_TYPES[1], text: 'የግሪሉ ጥገና ገና አልተጠናቀቀም።', status: ITEM_STATUSES[1] },
  { type: ITEM_TYPES[1], text: 'የኤግዝስት ፋን ጽዳት ይፈልጋል።', status: ITEM_STATUSES[0] },
  { type: ITEM_TYPES[2], text: 'በአጠቃላይ በሦስቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።', rating: 4 },
]);

/** The §40.2 mock conversation — register-valid triples (§11.4 registers, never invented strings). */
export const MOCK_CONVERSATION = Object.freeze({
  reasoning: AI_REASONING_DEFAULT,
  messages: [
    {
      role: MESSAGE_ROLES[0], // system — the generation turn record
      content: 'Report generated',
      provider: 'addis',
      model: AI_MODELS.addis[0].id,
      reasoning: AI_REASONING_DEFAULT,
    },
    {
      role: MESSAGE_ROLES[1], // user
      content: 'ለዛሬው ቀን ምን ያህል ስራዎች ተከናውነዋል?',
      provider: 'gemini',
      model: AI_MODELS.gemini[0].id,
      reasoning: AI_REASONING_DEFAULT,
    },
    {
      role: MESSAGE_ROLES[2], // assistant
      content: 'ዛሬ በሦስቱም ቅርንጫፎች የዕለት ተዕለት የአሠራር ሂደቶች ተከናውነዋል፤ በተጨማሪም በቡልቡላ ብራንች የካሸሮች ሥልጠና ተካሂዷል።',
      provider: 'gemini',
      model: AI_MODELS.gemini[0].id,
      reasoning: AI_REASONING_DEFAULT,
    },
  ],
});

/** Register parity guard — the fixture triples are members of the §11.4 registers. */
export function assertRegisterValidTriples() {
  const providers = new Set(Object.keys(AI_MODELS));
  for (const message of MOCK_CONVERSATION.messages) {
    const okRole = MESSAGE_ROLES.includes(message.role);
    const okProvider = providers.has(message.provider);
    const okModel = AI_MODELS[message.provider]?.some((entry) => entry.id === message.model);
    const okReasoning = AI_REASONING_EFFORTS.includes(message.reasoning);
    if (!okRole || !okProvider || !okModel || !okReasoning) {
      throw new Error(`Invalid mock conversation triple: ${JSON.stringify(message)}`);
    }
  }
  if (!Object.values(LANGUAGE_CODES).includes('am')) {
    throw new Error('The fixture language constant drifted');
  }
}