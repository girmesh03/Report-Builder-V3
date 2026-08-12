/**
 * @module components/reusable/AppToastContainer
 *
 * The single mount of the toast surface (§60.3, §41.4 item 4) — the
 * one ToastContainer in the application; no second mount exists.
 * Placement per §60.5: bottom-right on sm+; full-width top on xs
 * (< 600px); max stack 4 (older toasts auto-dismiss); auto-dismiss
 * durations come per-toast from §60.6 via showToast (utils/toast.jsx);
 * window blur never auto-dismisses (pauseOnFocusLoss false); the
 * §45.6 reduced-motion preference disables the slide animation.
 */
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const REDUCED_MOTION_STYLES = {
  "@media (prefers-reduced-motion: reduce)": {
    ".Toastify__toast": {
      transition: "none",
      animation: "none",
    },
  },
};

export default function AppToastContainer() {
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));

  const toastStyle = {
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    padding: "12px 16px",
    ...(isBelowSm && { width: "100%" }),
  };

  return (
    <>
      <GlobalStyles styles={REDUCED_MOTION_STYLES} />
      <ToastContainer
        position={isBelowSm ? "top-center" : "bottom-right"}
        autoClose={false}
        limit={4}
        newestOnTop
        closeOnClick={false}
        pauseOnHover
        pauseOnFocusLoss={false}
        draggable={false}
        style={isBelowSm ? { width: "100%" } : undefined}
        toastStyle={toastStyle}
      />
    </>
  );
}
