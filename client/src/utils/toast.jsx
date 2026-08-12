/**
 * @module utils/toast
 *
 * The single toast trigger API (§60.3, ADR-033): `showToast` is the
 * only entry into the toast surface anywhere in the application —
 * every listener (service responses, §27 error mapping, page
 * mutations) calls it. The loading variant renders the §46.17
 * spinner and never auto-dismisses; the caller dismisses it with
 * `dismissToast` when the operation completes (§60.4).
 *
 * react-toastify appears only here and at the §41.4 mount
 * (components/reusable/AppToastContainer.jsx) — grep gate §60.9.
 */
import { toast } from "react-toastify";
import MuiToast from "../components/reusable/MuiToast";
import { TOAST_AUTO_DISMISS_MS } from "./constants";

/**
 * @param {('success'|'error'|'info'|'warning'|'loading')} variant - Toast variant (§60.4).
 * @param {string} [title] - Toast title.
 * @param {string} [message] - Message from the §60.6 catalogue or the §27 server message.
 * @param {Object} [options] - Optional react-toastify overrides (autoClose, onClick, ...).
 * @returns {string|number} The toast id (needed to dismiss a loading toast).
 */
export const showToast = (variant, title, message, options = {}) => {
  const isLoading = variant === "loading";
  const autoClose =
    options.autoClose !== undefined
      ? options.autoClose
      : isLoading
        ? false
        : (TOAST_AUTO_DISMISS_MS[variant] ?? TOAST_AUTO_DISMISS_MS.success);

  return toast(<MuiToast variant={variant} title={title} message={message} />, {
    type: isLoading ? "default" : variant,
    autoClose,
    closeOnClick: false,
    pauseOnFocusLoss: false,
    role: "status",
    hideProgressBar: isLoading,
    icon: false,
    ...options,
  });
};

/**
 * Dismiss a toast by id (loading toasts on completion).
 * @param {string|number} id - The toast id returned by showToast.
 */
export const dismissToast = (id) => {
  toast.dismiss(id);
};
