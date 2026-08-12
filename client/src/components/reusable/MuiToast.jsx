/**
 * @module components/reusable/MuiToast
 *
 * The feedback-toast surface (§60.3/§60.4, belt §46.17): five
 * variant bodies (success / error / info / warning / loading),
 * themed §44.5/§44.4. These components carry the variant model;
 * the single mount (`AppToastContainer`) is fixed in the app
 * shell (§47.2) and the single trigger API (`showToast`) lives in
 * `utils/toast.jsx` — auth and error surfaces already toast in P3
 * (§42.5/§29); full §60 wiring follows in the §60 phase.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const VARIANT_META = Object.freeze({
  success: {
    Icon: CheckCircleOutlinedIcon,
    color: "success.main",
  },
  error: {
    Icon: ErrorOutlinedIcon,
    color: "error.main",
  },
  info: {
    Icon: InfoOutlinedIcon,
    color: "info.main",
  },
  warning: {
    Icon: WarningAmberOutlinedIcon,
    color: "warning.main",
  },
});

/**
 * @param {Object} props
 * @param {('success'|'error'|'info'|'warning'|'loading')} props.variant - Toast variant (§60.4).
 * @param {string} [props.title] - Toast title.
 * @param {string} [props.message] - Message from the §60.6 catalogue.
 * @param {ReactNode} [props.action] - Optional trailing action node.
 */
export default function MuiToast({ variant, title, message, action }) {
  const meta = VARIANT_META[variant];

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      {variant === "loading" ? (
        <CircularProgress size={18} thickness={5} sx={{ mt: 0.25, color: "text.secondary" }} />
      ) : (
        <Box component={meta.Icon} sx={{ mt: 0.25, fontSize: 20, color: meta.color }} />
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {title ? (
          <Typography
            variant="subtitle2"
            component="p"
            sx={{ overflowWrap: "anywhere" }}
          >
            {title}
          </Typography>
        ) : null}
        {message ? (
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ overflowWrap: "anywhere" }}
          >
            {message}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}

MuiToast.propTypes = {
  variant: PropTypes.oneOf(["success", "error", "info", "warning", "loading"]).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  action: PropTypes.node,
};