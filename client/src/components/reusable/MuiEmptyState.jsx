/**
 * @module components/reusable/MuiEmptyState
 *
 * The belt empty-state surface (§46.17, §60.2 state 2): a centered
 * icon + title + description column with an optional inline primary
 * action. Copy always comes from the owning section (§60.7); theme
 * tokens only (§44).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * @param {Object} props
 * @param {string} props.title - Empty-state headline (required, owning-section copy).
 * @param {string} [props.description] - Supporting line (text.secondary).
 * @param {ReactNode} [props.icon] - Leading icon (action.active).
 * @param {ReactNode} [props.action] - Inline primary action slot (§60.2).
 * @param {string} [props.minHeight] - Layout reserve; default `100%`.
 */
export default function MuiEmptyState({
  title,
  description,
  icon,
  action,
  minHeight = "100%",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1,
        px: 3,
        minHeight,
      }}
    >
      {icon ? (
        <Box
          sx={{
            display: "flex",
            color: "action.active",
            "& svg": { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Typography
        variant="body1"
        sx={{ fontWeight: 600, color: "text.primary" }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

MuiEmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
  minHeight: PropTypes.string,
};