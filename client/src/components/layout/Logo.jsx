/**
 * @module components/layout/Logo
 *
 * The shared product mark (§47.4/§47.5, locked decision 10): the
 * §43.2 report-header motif (hairline-ruled paper panel + the
 * spoken-report waveform traced once along the ስም line, #037af2 —
 * the favicon's own signature) beside the app name (`VITE_APP_NAME`,
 * §10.5) with a primary hairline rule under the wordmark (the paper's
 * ruling, not decoration). The logo navigates to `/dashboard` when
 * authenticated, else `/` — a fixed target pair, never recomposed.
 * Hover lifts the mark 1px (functional link affordance).
 */
import { useSelector } from "react-redux";
import { Link } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { selectAuthStatus } from "../../redux/features/authSlice";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Report Builder";

/**
 * @param {Object} props
 * @param {('full'|'mark')} [props.variant] - `full` shows name + mark; `mark` icon-only (mini sidebar, §47.4).
 */
export default function Logo({ variant = "full" }) {
  const status = useSelector(selectAuthStatus);
  const to = status === "authenticated" ? "/dashboard" : "/";

  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        textDecoration: "none",
        color: "text.primary",
        minWidth: 0,
        "&:hover .Rb-logo-mark": {
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        component="svg"
        className="Rb-logo-mark"
        width="28"
        height="28"
        viewBox="0 0 48 48"
        aria-hidden="true"
        sx={{ flexShrink: 0, transition: "transform 150ms ease" }}
      >
        <rect
          x="7"
          y="8"
          width="34"
          height="36"
          rx="8"
          fill="#0a0f14"
          fillOpacity="0.06"
        />
        <rect
          x="7"
          y="6"
          width="34"
          height="36"
          rx="8"
          fill="#fcfcfd"
          stroke="#c2c9d6"
        />
        <g stroke="#dfe3ea" strokeWidth="1.5" strokeLinecap="round">
          <line x1="13" y1="18" x2="35" y2="18" />
          <line x1="13" y1="26" x2="35" y2="26" />
          <line x1="13" y1="34" x2="35" y2="34" stroke="#c2c9d6" />
        </g>
        <path
          d="M14 34 L14 31 L17 31 L17 28.5 L20 28.5 L20 29.5 L23 29.5 L23 27.5 L26 27.5 L26 30 L29 30 L29 28.5 L32 28.5 L32 29.5 L35 29.5 L35 34"
          fill="none"
          stroke="#037af2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Box>
      {variant === "full" ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            {APP_NAME}
          </Typography>
          <Box
            sx={{
              width: 130,
              height: 2,
              borderRadius: 1,
              bgcolor: "primary.main",
              mt: 0.5,
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}
