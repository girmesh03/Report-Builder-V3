/**
 * @module utils/wizardValidation
 *
 * Step-1 create-flow validators (§29 manual validators): the client
 * mirror of the create contract's required-field protocol and the
 * day-clock pair rule — the only two rules the flow mirrors locally
 * (everything else is decided by the server when a step advances).
 * Each field validator is RHF-shaped (returns `true` or a message)
 * so Controllers can carry them as `rules.validate` — keeping the
 * None→error protocol intact (a resolver would validate the whole
 * form on the first blur). `validateStep1` composes the same checks
 * for the page's Next-gate.
 */
import { WIZARD } from './constants';

/**
 * @param {({day: number, month: number, year: number}|null)} value
 * @returns {true|string}
 */
export function validateDate(value) {
  return value ? true : WIZARD.step1.dateRequired;
}

/**
 * @param {Object|null} value - dayjs or null.
 * @returns {true|string}
 */
export function validateClockIn(value) {
  return value ? true : WIZARD.step1.clockInRequired;
}

/**
 * @param {Object|null} value - dayjs or null.
 * @param {Object|null} clockIn - The day-pair start (dayjs).
 * @returns {true|string}
 */
export function validateClockOut(value, clockIn) {
  if (!value) {
    return WIZARD.step1.clockOutRequired;
  }
  if (clockIn && !value.isAfter(clockIn)) {
    return WIZARD.step1.clockOutAfterClockIn;
  }
  return true;
}

/**
 * @param {string|null} value - Branch _id.
 * @returns {true|string}
 */
export function validateBranch(value) {
  return value ? true : WIZARD.step1.branchRequired;
}

/**
 * The supervisor's name (§52.4): a required 1..100 field — the same
 * rule the create validator enforces server-side.
 * @param {string|null} value
 * @returns {true|string}
 */
export function validateSupervisorName(value) {
  const text = String(value ?? "").trim();
  if (text.length === 0) {
    return WIZARD.step1.supervisorRequired;
  }
  if (text.length > 100) {
    return WIZARD.step1.supervisorTooLong;
  }
  return true;
}

/**
 * Visits validation: with two or more visits every branch after the
 * main carries its own required, ordered pair. The main visit (index
 * 0) rides the day pair and is never checked here — it is synced to
 * the day times at the form level.
 * @param {Array<{branch: string, clockIn: (Object|null), clockOut: (Object|null)}>} visits
 * @returns {true|string}
 */
export function validateVisits(visits) {
  const others = (visits ?? []).slice(1);
  if (others.length === 0) {
    return true;
  }
  const bad = others.find(
    (visit) => !visit.clockIn || !visit.clockOut || !visit.clockOut.isAfter(visit.clockIn),
  );
  return bad ? WIZARD.step1.visitTimesRequired : true;
}

/**
 * Whole-form composition for the page's Next gate — the same checks
 * the fields carry individually.
 * @param {Object} values - RHF watched values.
 * @returns {Object<string, {type: string, message: string}>} RHF-shaped errors.
 */
export function validateStep1(values) {
  const errors = {};
  const checks = [
    ['date', validateDate(values.date)],
    ['clockIn', validateClockIn(values.clockIn)],
    ['clockOut', validateClockOut(values.clockOut, values.clockIn)],
    ['branch', validateBranch(values.branch)],
    ['supervisorName', validateSupervisorName(values.supervisorName)],
    ['visits', validateVisits(values.visits)],
  ];
  checks.forEach(([key, message]) => {
    if (message !== true) {
      errors[key] = { type: 'validate', message };
    }
  });
  return errors;
}