/**
 * @module pages/Reports
 *
 * Interim placeholder for the §50 Reports page (list/grid toggle) —
 * replaced by the full implementation in the P4 pages phase (§66.9
 * P4). The interim body is the §60.2 empty-state surface
 * (MuiEmptyState, §46.17) on the §50 empty copy; the P4 page owns
 * the list state machine and replaces it.
 */
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

export function Component() {
  return (
    <MuiEmptyState
      title="No reports yet"
      description="The §50 reports list lands in the P4 pages phase — here is the empty state it will show."
      icon={<DescriptionOutlinedIcon />}
      minHeight="60vh"
    />
  );
}

export default Component;