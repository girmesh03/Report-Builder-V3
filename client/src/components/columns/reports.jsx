/**
 * @module components/columns/reports
 *
 * The §50.4 report column set (§15.6, ADR-034), consumed by the
 * MuiDataGrid on the Reports page. Column values stay plain strings
 * so the grid's own CSV export (§58.4) serializes full, untruncated
 * data — the ellipsis is purely visual, in `renderCell`. Snapshot
 * values everywhere (tombstone-safe §17.4/§20): branch names from
 * `branches[].name`. The user only ever sees and acts on their own
 * resources (§9 per-user model), so no owner/supervisor column
 * exists. Sorting is server-owned (§31 sort = reportDate desc,
 * createdAt tiebreak) — all columns are `sortable: false` so the
 * grid never re-sorts a single page.
 *
 * Actions follow the per-user lifecycle rule: active rows offer
 * Archive (isArchived:false), archived rows offer Restore or
 * Delete. Below md the Updated then Branch columns collapse
 * (§50.4) — the built-in columns toggle still offers the surviving
 * columns.
 */
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatEthiopianDate } from "../../utils/ethiopianDate";
import MuiStatusBadge from "../reusable/MuiStatusBadge";

/**
 * The full snapshot string of a report's branch names — the cell
 * value (and so the CSV export value, §58.4); `null` names (deleted
 * branch joins, §17.4) are skipped.
 * @param {Array<{branch: string|null, name: string|null}>} branches - Snapshot rows.
 * @returns {string} Joined names, or "—".
 */
const branchText = (branches) => {
  const names = (branches ?? []).map((entry) => entry?.name).filter(Boolean);
  return names.length ? names.join(", ") : "—";
};

const dateText = (value) => formatEthiopianDate(value) ?? "—";

/**
 * The icon row of §46.8/§50.6: raw IconButtons (never MuiButton,
 * §44.2), colors via `sx` only, tooltips per §45.3/§46.8. Clicking
 * a tool button never triggers the row-click navigation. Active
 * rows: View, Edit, Archive. Archived rows: View, Edit, Restore,
 * Delete (per-user lifecycle rule — §31.7).
 */
const renderActions = ({
  row,
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) => (
  <Box sx={{ display: "flex", gap: 0.5 }}>
    <Tooltip title="View">
      <IconButton
        size="small"
        aria-label="View"
        onClick={(event) => {
          event.stopPropagation();
          onView(row);
        }}
      >
        <VisibilityIcon sx={{ color: "primary.main", fontSize: 20 }} />
      </IconButton>
    </Tooltip>
    <Tooltip title="Edit">
      <IconButton
        size="small"
        aria-label="Edit"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(row);
        }}
      >
        <EditIcon sx={{ color: "warning.main", fontSize: 20 }} />
      </IconButton>
    </Tooltip>
    {row.isArchived ? (
      <>
        <Tooltip title="Restore">
          <IconButton
            size="small"
            aria-label="Restore"
            onClick={(event) => {
              event.stopPropagation();
              onRestore(row);
            }}
          >
            <UnarchiveIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row);
            }}
          >
            <DeleteIcon sx={{ color: "error.main", fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <Tooltip title="Archive">
        <IconButton
          size="small"
          aria-label="Archive"
          onClick={(event) => {
            event.stopPropagation();
            onArchive(row);
          }}
        >
          <ArchiveIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

/**
 * Builds the §50.4 column set.
 * @param {Object} handlers - Row-action callbacks (receive the row).
 * @param {Function} handlers.onView - Opens the details page.
 * @param {Function} handlers.onEdit - Re-enters the wizard (§52.3).
 * @param {Function} handlers.onArchive - Asks for archive confirmation.
 * @param {Function} handlers.onRestore - Asks for restore confirmation.
 * @param {Function} handlers.onDelete - Asks for delete confirmation (archived rows).
 * @param {boolean} [handlers.isNarrow] - Below 900px (collapse priority §50.4).
 * @returns {Array<Object>} MUI X column definitions.
 */
export function buildReportsColumns({
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  isNarrow = false,
}) {
  const actions = {
    onView,
    onEdit,
    onArchive,
    onRestore,
    onDelete,
  };
  const columns = [
    {
      field: "reportDate",
      headerName: "Date",
      minWidth: 110,
      sortable: false,
      valueGetter: (_value, row) => dateText(row.reportDate),
    },
    {
      field: "branches",
      headerName: "Branch(es)",
      minWidth: 200,
      flex: 1,
      sortable: false,
      valueGetter: (_value, row) => branchText(row.branches),
      renderCell: (params) => (
        <Box sx={{ overflow: "hidden", maxWidth: "100%" }}>
          <Typography noWrap variant="body2" title={params.value}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      sortable: false,
      valueGetter: (_value, row) => row.status,
      renderCell: (params) => <MuiStatusBadge status={params.value} />,
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      minWidth: 110,
      sortable: false,
      valueGetter: (_value, row) => dateText(row.updatedAt),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 176,
      sortable: false,
      filterable: false,
      disableExport: true,
      renderCell: (params) => renderActions({ row: params.row, ...actions }),
    },
  ];

  if (isNarrow) {
    const collapsed = new Set(["updatedAt", "branches"]);
    return columns.filter((column) => !collapsed.has(column.field));
  }
  return columns;
}
