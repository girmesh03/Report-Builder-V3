/**
 * @module components/reusable/MuiPageHeader
 *
 * The standard page header (§46.12) — the §43.2 header-strip motif:
 * title (h4) + optional subtitle on one line with the right-side
 * `actions` slot (inline, vertically centered); `mb: 2`; bottom
 * border. The subtitle is suppressed below `sm` (xs) so the header
 * stays a single line on phones; no eyebrow exists (removed R3-fix
 * follow-up).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * @param {Object} props
 * @param {string} props.title - Page title.
 * @param {string} [props.subtitle] - Optional subtitle line (suppressed below sm).
 * @param {ReactNode} [props.actions] - Right-aligned header actions.
 * @param {boolean} [props.hideSubtitle] - Force-hide the subtitle.
 */
export default function MuiPageHeader({
  title,
  subtitle,
  actions,
  hideSubtitle = false,
}) {
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));
  const hide = hideSubtitle || (isBelowSm && Boolean(subtitle));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
        pb: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          component="h1"
          noWrap
          sx={{ maxWidth: "100%", textOverflow: "ellipsis" }}
        >
          {title}
        </Typography>
        {!hide && subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>{actions}</Box> : null}
    </Box>
  );
}

MuiPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  hideSubtitle: PropTypes.bool,
};