/**
 * @module components/reusable/MuiPageHeader
 *
 * The standard page header (§46.12) — the §43.2 header-strip motif:
 * eyebrow (small-caps, text.secondary) + title (h4) + optional
 * subtitle; right-side `actions` slot; `mb: 2`; bottom border.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * @param {Object} props
 * @param {string} [props.eyebrow] - Small-caps section label.
 * @param {string} props.title - Page title.
 * @param {string} [props.subtitle] - Optional subtitle line.
 * @param {ReactNode} [props.actions] - Right-aligned header actions.
 * @param {boolean} [props.hideSubtitle] - Force-hide the subtitle.
 */
export default function MuiPageHeader({
  eyebrow,
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
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
        pb: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 1,
              display: "block",
              mb: 0.5,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h4" component="h1" sx={{ wordBreak: "break-word" }}>
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
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  hideSubtitle: PropTypes.bool,
};