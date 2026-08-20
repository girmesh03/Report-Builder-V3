/**
 * @module utils/ethiopianDate
 *
 * Ethiopian↔Gregorian calendar conversions — the **server mirror of
 * the client's `utils/ethiopianDate.js`** (§13.4, §46.6, §43.6): the
 * same epoch, the same leap rule (every four years, no exception),
 * and conversions from the Date's **local components**
 * (`getFullYear/getMonth/getDate`) — never UTC components — so the
 * Ethiopian date the user picked in the frontend date picker (which
 * submits the ISO of the local-noon Gregorian equivalent, §52.4)
 * round-trips identically server-side. Consumers: the §34.3
 * generation prompt's date block (Ethiopian `DD-MM-YY` display,
 * §6.3 field 1), the §30.2.1 branch-detail `reportsThisMonth`
 * (Ethiopian-month bucketing, §38.5; null dates are excluded from
 * buckets), and the §38.5 rollups. `dayjs` does all formatting —
 * no native Date formatting (§9.3).
 */
const ETHIOPIAN_EPOCH_JDN = 1724221;

const MONTH_NAMES_AMHARIC = Object.freeze([
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት',
  'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሀሴ', 'ጳጉሜ',
]);

/**
 * @typedef {Object} EthiopianDate
 * @property {number} day - Day of the month, 1-based.
 * @property {number} month - Month, 1-based (1 = Meskerem … 13 = Pagume).
 * @property {number} year - Ethiopian (Incarnation Era) year.
 */

/**
 * Julian Day Number of a proleptic Gregorian calendar date.
 * @param {number} year - Gregorian year.
 * @param {number} month - Gregorian month, 1-based.
 * @param {number} day - Gregorian day of month, 1-based.
 * @returns {number} The integer JDN.
 */
function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const yy = year + 4800 - a;
  const mm = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

/**
 * Converts a Date to its Ethiopian date using **local** components
 * (the mirror of the client's `gregorianToEthiopian`).
 * @param {Date|string} value - The stored date (UTC Date or ISO string).
 * @returns {EthiopianDate} The Ethiopian equivalent.
 */
export function gregorianToEthiopian(value) {
  const date = value instanceof Date ? value : new Date(value);
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const days = jdn - ETHIOPIAN_EPOCH_JDN;
  const cycleIndex = Math.floor(days / 1461);
  const rem = days % 1461;
  const yearInCycle = rem >= 1096 ? 3 : rem >= 730 ? 2 : rem >= 365 ? 1 : 0;
  const dayInYear = yearInCycle === 3 ? rem - 1096 : rem - yearInCycle * 365;
  return {
    year: cycleIndex * 4 + yearInCycle + 1,
    month: Math.floor(dayInYear / 30) + 1,
    day: (dayInYear % 30) + 1,
  };
}

/**
 * Ethiopian date → the proleptic Gregorian calendar date it falls
 * on (the mirror of the client's `ethiopianToGregorian`).
 * @param {EthiopianDate} ethDate - The Ethiopian date.
 * @returns {{ year: number, month: number, day: number }} Gregorian calendar date.
 */
export function ethiopianToGregorian(ethDate) {
  const { day, month, year } = ethDate;
  const jdn =
    ETHIOPIAN_EPOCH_JDN +
    (year - 1) * 365 +
    Math.floor(year / 4) +
    (month - 1) * 30 +
    (day - 1);
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + d - 4800 + Math.floor(m / 10),
    month: m + 3 - 12 * Math.floor(m / 10),
    day: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

/**
 * The Ethiopian-month identity of a stored date — `{ year, month }`
 * (1-based month; 13 = Pagume). The §38.5 bucketing key: reports
 * with `date` in the same Ethiopian month share a bucket; null
 * dates are excluded from buckets (never bucketed, §38.5).
 * @param {Date|string} value - The stored date.
 * @returns {{ year: number, month: number }|null} The bucket key, or null for a null date.
 */
export function ethiopianMonthOf(value) {
  if (!value) return null;
  const eth = gregorianToEthiopian(value);
  return { year: eth.year, month: eth.month };
}

/**
 * The Ethiopian month of "today" (server local time) — the
 * `reportsThisMonth` reference bucket of §30.2.1/§38.5.
 * @returns {{ year: number, month: number }} The current Ethiopian-month bucket.
 */
export function currentEthiopianMonth() {
  return ethiopianMonthOf(new Date());
}

/**
 * The §6.3/§43.6 display formatter — a stored date renders as its
 * Ethiopian `DD-MM-YY` (numeric notation, English chrome — ADR-011).
 * Null-safe: a missing value stays missing.
 * @param {Date|string} value - The stored date (UTC Date or ISO string).
 * @returns {string|null} `DD-MM-YY` or null.
 */
export function formatEthiopianDate(value) {
  if (!value) return null;
  const eth = gregorianToEthiopian(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${pad(eth.day)}-${pad(eth.month)}-${String(eth.year).slice(-2)}`;
}

/**
 * The Gregorian day range of an Ethiopian month — the §38.5/§30.2.1
 * bucketing bounds: the reports of a branch whose `date` falls in
 * the given Ethiopian `{ year, month }` are those with
 * `date ∈ [start, end)`. The bounds are **calendar-day midnight
 * (UTC)** — `[00:00Z of day 1, 00:00Z of the day after the last)` —
 * so a stored instant on any calendar day of the month qualifies:
 * the client submits the picker's local-noon ISO (09:00Z for
 * Ethiopia's +03:00), and date-only ISOs store at 00:00Z — both
 * fall inside their calendar day's [00:00Z, 24:00Z) window
 * (verified 2026-08-20 — a noon-based start excluded first-day
 * reports, fixed).
 * @param {number} year - Ethiopian year.
 * @param {number} month - 1-based Ethiopian month (13 = Pagume).
 * @returns {{ start: Date, end: Date }} The half-open range bounds.
 */
export function ethiopianMonthRange(year, month) {
  const first = ethiopianToGregorian({ day: 1, month, year });
  const isLeap = year % 4 === 0;
  const monthLength = month === 13 ? (isLeap ? 6 : 5) : 30;
  const start = new Date(Date.UTC(first.year, first.month - 1, first.day));
  const end = new Date(start.getTime() + monthLength * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * The Amharic month name of an Ethiopian month (1-based; the §6
 * vocabulary uses these in report content). 13 = ጳጉሜ.
 * @param {number} month - 1-based Ethiopian month.
 * @returns {string} The Amharic month name.
 */
export function ethiopianMonthName(month) {
  return MONTH_NAMES_AMHARIC[month - 1] ?? '';
}