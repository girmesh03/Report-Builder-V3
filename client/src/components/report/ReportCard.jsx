/**
 * @module components/report/ReportCard
 *
 * The §44.6 listing card of the Reports page's card-grid mode
 * (§50.5, `report/` domain folder §15.5): reportDate as the title
 * line, ellipsized branch snapshot names (§45.5, tombstone-safe
 * §17.4), the §46.13 status badge and Updated caption, and the same
 * action icon row as the grid's Actions column (§46.8/§50.6) —
 * active rows Archive, archived rows Restore or Delete. The user
 * only ever sees their own reports, so no owner/supervisor caption
 * exists. Cards are never selectable — selection is a grid-mode
 * feature (§50.7).
 */
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatEthiopianDate } from "../../utils/ethiopianDate";
import MuiStatusBadge from "../reusable/MuiStatusBadge";

/**
 * @param {Object} props
 * @param {Object} props.report - The ReportDto row (§31 list DTO).
 * @param {Function} props.onView - Opens the details page.
 * @param {Function} props.onEdit - Re-enters the wizard (§52.3).
 * @param {Function} props.onArchive - Asks for archive confirmation.
 * @param {Function} props.onRestore - Asks for restore confirmation.
 * @param {Function} props.onDelete - Asks for delete confirmation.
 */
export default function ReportCard({
  report,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const branchNames = (report.branches ?? [])
    .map((entry) => entry?.name)
    .filter(Boolean)
    .join(", ");
  const reportDate = formatEthiopianDate(report.reportDate);
  const updatedAt = formatEthiopianDate(report.updatedAt);

  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 600 }}
          title={reportDate ?? undefined}
        >
          {reportDate ?? "—"}
        </Typography>
        <MuiStatusBadge status={report.status} />
      </Box>

      <Typography noWrap variant="body2" color="text.secondary" title={branchNames || undefined}>
        {branchNames || "—"}
      </Typography>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Updated {updatedAt ?? "—"}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
        <Tooltip title="View">
          <IconButton size="small" aria-label="View" onClick={() => onView(report)}>
            <VisibilityIcon sx={{ color: "primary.main", fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" aria-label="Edit" onClick={() => onEdit(report)}>
            <EditIcon sx={{ color: "warning.main", fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        {report.isArchived ? (
          <>
            <Tooltip title="Restore">
              <IconButton size="small" aria-label="Restore" onClick={() => onRestore(report)}>
                <UnarchiveIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" aria-label="Delete" onClick={() => onDelete(report)}>
                <DeleteIcon sx={{ color: "error.main", fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Archive">
            <IconButton size="small" aria-label="Archive" onClick={() => onArchive(report)}>
              <ArchiveIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
}

ReportCard.propTypes = {
  report: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};