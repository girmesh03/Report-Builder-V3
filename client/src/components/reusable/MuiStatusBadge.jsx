/**
 * @module components/reusable/MuiStatusBadge
 *
 * Read-only presentation of `report.status` — a non-interactive,
 * color-coded chip (§46.13, §43.2 role binding). Also renders the
 * branch variant ("Active" / "Archived", §56.3). Labels come from
 * the §11.5 mirror (`REPORT_STATUS_LABELS`, §49.4).
 */
import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import { REPORT_STATUSES, REPORT_STATUS_LABELS } from "../../utils/constants";

/**
 * @type {Object<string, string>}
 */
const REPORT_COLOR_MAP = Object.freeze({
  draft: "default",
  audio_attached: "warning",
  transcribed: "info",
  generated: "primary",
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
      label={REPORT_STATUS_LABELS[status]}
      color={REPORT_COLOR_MAP[status]}
      variant="outlined"
    />
  );
}

MuiStatusBadge.propTypes = {
  status: PropTypes.oneOf(REPORT_STATUSES),
  branchActive: PropTypes.bool,
};