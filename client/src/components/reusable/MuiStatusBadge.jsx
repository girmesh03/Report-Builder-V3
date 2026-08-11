/**
 * @module components/reusable/MuiStatusBadge
 *
 * Read-only presentation of `report.status` — a non-interactive,
 * color-coded chip (§46.13, §43.2 role binding). Also renders the
 * branch variant ("Active" / "Archived", §56.3).
 */
import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import { REPORT_STATUSES } from "../../utils/constants";

/**
 * @type {Object<string, string>}
 */
const REPORT_COLOR_MAP = Object.freeze({
  draft: "default",
  audio_attached: "warning",
  transcribed: "info",
  reviewed: "primary",
  completed: "success",
});

/**
 * @type {Object<string, string>}
 */
const REPORT_LABEL_MAP = Object.freeze({
  draft: "Draft",
  audio_attached: "Audio attached",
  transcribed: "Transcribed",
  reviewed: "Reviewed",
  completed: "Completed",
});

/**
 * @param {Object} props
 * @param {string} [props.status] - One of REPORT_STATUSES (report variant).
 * @param {boolean|null} [props.branchActive] - Branch variant (§56.3).
 */
export default function MuiStatusBadge({ status, branchActive }) {
  if (branchActive !== undefined && branchActive !== null) {
    return (
      <Chip
        size="small"
        label={branchActive ? "Active" : "Archived"}
        color={branchActive ? "success" : "default"}
        variant="outlined"
      />
    );
  }

  if (!REPORT_STATUSES.includes(status)) {
    return null;
  }

  return (
    <Chip
      size="small"
      label={REPORT_LABEL_MAP[status]}
      color={REPORT_COLOR_MAP[status]}
      variant="outlined"
    />
  );
}

MuiStatusBadge.propTypes = {
  status: PropTypes.oneOf(REPORT_STATUSES),
  branchActive: PropTypes.bool,
};