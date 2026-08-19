/**
 * @module components/reusable/LoadingSpinner
 *
 * Centered CircularProgress for full-page or section-level loading
 * (§46.14). Full-page default minHeight 100vh; sections override.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

/**
 * @param {Object} props
 * @param {string} [props.message] - Optional loading caption (text.secondary).
 * @param {string} [props.minHeight] - Layout reserve; default `100vh`.
 */
export default function LoadingSpinner({ message, minHeight = "100vh" }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight,
      }}
    >
      <CircularProgress size={40} thickness={4.5} disableShrink />
      {message ? (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  minHeight: PropTypes.string,
};
