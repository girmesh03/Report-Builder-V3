/**
 * @module components/reusable/MuiStatCard
 *
 * The Dashboard KPI card (§46.17, §49): label (small-caps eyebrow),
 * value (h3), start-adornment icon in the role color, optional trend
 * caption; plain card surface (§44.6).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

/**
 * @param {Object} props
 * @param {string} props.label - Small-caps eyebrow.
 * @param {string|number} props.value - The KPI value.
 * @param {ReactNode} [props.icon] - Start-adornment icon.
 * @param {string} [props.iconColor] - Role color, e.g. "primary.main".
 * @param {string} [props.trend] - Optional trend caption.
 * @param {Object} [props.sx] - Card style overrides.
 */
export default function MuiStatCard({ label, value, icon, iconColor = "primary.main", trend, sx }) {
  return (
    <Card sx={{ p: 2.5, height: "100%", ...sx }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {icon ? (
          <Box sx={{ color: iconColor, display: "flex", mt: 0.5 }}>{icon}</Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block" }}
          >
            {label}
          </Typography>
          <Typography variant="h3" component="p" sx={{ mt: 0.5, wordBreak: "break-word" }}>
            {value}
          </Typography>
          {trend ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {trend}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
}

MuiStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node,
  iconColor: PropTypes.string,
  trend: PropTypes.string,
  sx: PropTypes.object,
};