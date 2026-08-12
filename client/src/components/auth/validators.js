/**
 * @module components/auth/validators
 *
 * The manual-resolver rules of §48.3/§48.4 (no zod, §13.6/§29): every
 * rule returns the §48-table error copy as a string, or null when the
 * value passes. The same email rule serves both forms; the
 * confirm-password rule is register-only (client-side — the §28
 * contract never receives the confirmation, §48.4).
 */

/**
 * Email rule (§48.3/§48.4): required, then format.
 * @param {string} value - Field value.
 * @returns {string|null} Error copy or null.
 */
export const validateEmail = (value) => {
  if (!value) {
    return "Email is required";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return "Enter a valid email address";
  }
  return null;
};

/**
 * Password rule (§48.3/§48.4): required, then min length 8.
 * @param {string} value - Field value.
 * @returns {string|null} Error copy or null.
 */
export const validatePassword = (value) => {
  if (!value) {
    return "Password is required";
  }
  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
};

/**
 * Confirm-password rule (§48.4): required, then must equal password.
 * @param {string} value - confirmPassword field value.
 * @param {string} password - The password field value (from form values).
 * @returns {string|null} Error copy or null.
 */
export const validateConfirmPassword = (value, password) => {
  if (!value) {
    return "Please confirm your password";
  }
  if (value !== password) {
    return "Passwords must match";
  }
  return null;
};