/**
 * @module utils/ethiopianDate
 *
 * Ethiopian↔Gregorian conversion utilities (§46.6, §43.6): a
 * lightweight local utility, no npm package (§13.4). The Ethiopian
 * calendar is solar: twelve 30-day months plus the epagomenal month
 * Pagume (5 days, 6 in a leap year); leap years repeat every four
 * years without exception. The date picker renders English month
 * names with "Pagume" in the header (§43.6).
 */

/**
 * Julian Day Number of 1 Meskerem 1 (Incarnation Era), the Ethiopian
 * calendar epoch. Verified against the fixed anchors 1 Meskerem 2000 =
 * 12 Sep 2007, 1 Meskerem 1992 = 12 Sep 1999, and 3 Nahase 2018 =
 * 9 Aug 2026.
 * @type {number}
 */
const ETHIOPIAN_EPOCH_JDN = 1724221;

/**
 * @typedef {Object} EthiopianDate
 * @property {number} day - Day of the month, 1-based.
 * @property {number} month - Month, 1-based (1 = Meskerem … 13 = Pagume).
 * @property {number} year - Ethiopian (Incarnation Era) year.
 */

/**
 * Converts a proleptic Gregorian date to its Julian Day Number.
 * @param {number} year - Gregorian year.
 * @param {number} month - Gregorian month, 1-based.
 * @param {number} day - Gregorian day of month, 1-based.
 * @returns {number} The integer Julian Day Number.
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
 * Converts a Julian Day Number to its proleptic Gregorian date.
 * @param {number} jdn - The integer Julian Day Number.
 * @returns {{ year: number, month: number, day: number }} Gregorian date.
 */
function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * Converts an Ethiopian date to the equivalent proleptic Gregorian
 * `Date` (local noon to stay clear of DST edges).
 * @param {EthiopianDate} ethDate - The Ethiopian date to convert.
 * @returns {Date} The Gregorian equivalent.
 */
export function ethiopianToGregorian(ethDate) {
  const { day, month, year } = ethDate;
  const jdn =
    ETHIOPIAN_EPOCH_JDN +
    (year - 1) * 365 +
    Math.floor(year / 4) +
    (month - 1) * 30 +
    (day - 1);
  const gregorian = jdnToGregorian(jdn);
  return new Date(gregorian.year, gregorian.month - 1, gregorian.day, 12);
}

/**
 * Converts a JavaScript `Date` to its Ethiopian date.
 * @param {Date} jsDate - The Gregorian date to convert.
 * @returns {EthiopianDate} The Ethiopian equivalent.
 */
export function gregorianToEthiopian(jsDate) {
  const jdn = gregorianToJDN(
    jsDate.getFullYear(),
    jsDate.getMonth() + 1,
    jsDate.getDate()
  );
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