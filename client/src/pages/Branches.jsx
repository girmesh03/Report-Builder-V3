/**
 * @module pages/Branches
 *
 * Interim placeholder for the §56 Branches page — replaced by the
 * full implementation in the P4 pages phase (§66.9 P4). The interim
 * body is the §60.2 empty-state surface (MuiEmptyState, §46.17) on
 * the §56 empty copy; the P4 page owns the list state machine and
 * replaces it.
 */
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

export function Component() {
  return (
    <MuiEmptyState
      title="No branches yet"
      description="The §56 branches list lands in the P4 pages phase — here is the empty state it will show."
      icon={<AccountTreeOutlinedIcon />}
      minHeight="60vh"
    />
  );
}

export default Component;