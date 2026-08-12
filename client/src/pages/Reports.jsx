/**
 * @module pages/Reports
 *
 * The §50 Reports page — the management surface of the daily
 * workflow. On md+ the header (§46.12) introduces the page, then a
 * single action button group (Filter with an active-count badge,
 * List/Cards view toggle, Create) replaces the old select row and
 * toggle. Below md the page header and the List/Cards buttons are
 * absent — the group holds only Filter + Create and the view is
 * cards only (1 column xs, 2 sm, 3 md, 4 lg). Filter opens a
 * provisional dialog: the filter feature itself is TBD (OQ-009 —
 * what to filter, single vs multi branch, pagination, date vs
 * date-range). The list query is page/limit only and the mock
 * lists ALL reports by default, so archived rows carry their
 * state-correct actions in both views.
 * List mode renders the MuiDataGrid with the
 * `components/columns/reports.jsx` column set (§50.4) and
 * server-driven pagination; cards mode renders the ReportCard grid
 * (§50.5) with the MuiPagination footer (§46.7) — cards on every
 * breakpoint below md.
 *
 * Per-user lifecycle rule (§31.7): active rows offer Archive
 * (isArchived:false → archive), archived rows offer Restore or
 * Delete (the mock permanently removes on delete of an archived
 * row — retention simulated). All actions confirm through
 * MuiConfirmDialog and toast exactly once (§60.5); cache updates
 * flow through the §42.6 invalidation tags — no manual refetch
 * (ADR-033). The grid toolbar's CSV item exports the selected rows
 * via the grid's own serializer (§58.2/§58.4) and is disabled while
 * nothing is selected (§58.5). Four §60.2 states; the no-rows
 * overlay fills the grid's body height (§46.8).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import ButtonGroup from "@mui/material/ButtonGroup";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useGridApiContext } from "@mui/x-data-grid";
import MuiPageHeader from "../components/reusable/MuiPageHeader";
import MuiButton from "../components/reusable/MuiButton";
import MuiDataGrid from "../components/reusable/MuiDataGrid";
import MuiPagination from "../components/reusable/MuiPagination";
import MuiConfirmDialog from "../components/reusable/MuiConfirmDialog";
import MuiDialog from "../components/reusable/MuiDialog";
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import LoadingSpinner from "../components/reusable/LoadingSpinner";
import ReportCard from "../components/report/ReportCard";
import { buildReportsColumns } from "../components/columns/reports";
import {
  useListReportsQuery,
  useArchiveReportMutation,
  useRestoreReportMutation,
  useDeleteReportMutation,
} from "../redux/features/reportsEndpoints";
import { showToast } from "../utils/toast.jsx";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
  TOAST_CATALOGUE,
} from "../utils/constants";

/**
 * The empty surface (§60.2 state 2) shared by the grid's
 * noRowsOverlay (§46.8) and the cards mode. The grid variant fills
 * the grid body (`minHeight: "100%"` — the overlay wrapper is
 * sized to the viewport minus header/footer); the cards variant
 * passes its own reserved height.
 */
const ListEmptyContent = ({ minHeight = "100%", onNewReport }) => (
  <MuiEmptyState
    minHeight={minHeight}
    icon={<DescriptionOutlinedIcon />}
    title="No reports yet"
    description="Create your first report"
    action={
      <MuiButton
        variant="text"
        color="success"
        startIcon={<AddIcon />}
        onClick={onNewReport}
      >
        New report
      </MuiButton>
    }
  />
);

ListEmptyContent.propTypes = {
  minHeight: PropTypes.string,
  onNewReport: PropTypes.func.isRequired,
};

/**
 * The §60.2 error region: the §60 toast already fired; this is the
 * inline retry affordance over the failing list surface.
 */
const ListErrorContent = ({ message, onRetry }) => (
  <Card sx={{ p: 3 }}>
    <MuiEmptyState
      minHeight="320px"
      icon={<ErrorOutlineIcon />}
      title="Could not load reports"
      description={message ?? TOAST_CATALOGUE.error.generic}
      action={
        <MuiButton variant="outlined" onClick={onRetry}>
          Retry
        </MuiButton>
      }
    />
  </Card>
);

ListErrorContent.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

/**
 * The "Export selected as CSV" menu item of the grid toolbar
 * (§50.7/§58.2): rendered through the built-in toolbar's
 * `additionalExportMenuItems`, disabled while nothing is selected
 * (§58.5), and driving the grid's own CSV serializer over the
 * selected rows (§58.4 — English headers in column order, full
 * snapshot strings, DD-MM-YY values, RFC 4180 quoting).
 */
const ExportSelectedCsvItem = ({ onClose, selectedCount }) => {
  const apiRef = useGridApiContext();
  return (
    <MenuItem
      disabled={selectedCount === 0}
      onClick={() => {
        apiRef.current.exportDataAsCsv({
          fileName: `reports-${dayjs().format("YYYY-MM-DD")}.csv`,
          utf8WithBom: true,
          getRowsToExport: (params) =>
            Array.from(params.apiRef.current.getSelectedRows().keys()),
        });
        onClose();
      }}
    >
      Export selected as CSV
    </MenuItem>
  );
};

ExportSelectedCsvItem.propTypes = {
  onClose: PropTypes.func.isRequired,
  selectedCount: PropTypes.number.isRequired,
};

/** §50.5 card-shaped skeletons while the first cards payload loads. */
const CardSkeleton = () => (
  <Card sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Box sx={{ width: "45%", height: 16, bgcolor: "action.hover", borderRadius: 1 }} />
      <Box sx={{ width: 64, height: 22, bgcolor: "action.hover", borderRadius: 6 }} />
    </Box>
    <Box sx={{ width: "70%", height: 12, bgcolor: "action.hover", borderRadius: 1 }} />
    <Box sx={{ flexGrow: 1 }} />
    <Box sx={{ width: "55%", height: 12, bgcolor: "action.hover", borderRadius: 1 }} />
  </Card>
);

export function Component() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));

  const [mode, setMode] = useState("list");
  const [page, setPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULT_LIMIT);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirm, setConfirm] = useState({ kind: null, report: null });
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, error, isError, isLoading, isFetching, refetch } = useListReportsQuery({
    page,
    limit: pageSize,
  });

  const [archiveReport] = useArchiveReportMutation();
  const [restoreReport] = useRestoreReportMutation();
  const [deleteReport] = useDeleteReportMutation();

  const [prevListData, setPrevListData] = useState(data);
  if (data !== prevListData) {
    setPrevListData(data);
    if (data && data.totalPages > 0 && page > data.totalPages) {
      setPage(data.totalPages);
    }
  }

  useEffect(() => {
    if (isError) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    }
  }, [isError, error]);

  const showList = !isBelowMd && mode === "list";
  const loading = isLoading || isFetching;
  const docs = data?.docs ?? [];

  const changePage = (nextPage, nextLimit) => {
    if (nextLimit !== pageSize) {
      setPageSize(nextLimit);
      setPage(PAGINATION_DEFAULT_PAGE);
    } else if (nextPage !== page) {
      setPage(nextPage);
    }
  };

  const onView = useCallback(
    (report) => navigate(`/reports/${report._id}`),
    [navigate],
  );
  const onEdit = useCallback(
    (report) => navigate(`/reports/${report._id}/wizard`),
    [navigate],
  );
  const onArchive = useCallback((report) => setConfirm({ kind: "archive", report }), []);
  const onRestore = useCallback((report) => setConfirm({ kind: "restore", report }), []);
  const onDelete = useCallback((report) => setConfirm({ kind: "delete", report }), []);

  const columns = useMemo(
    () => buildReportsColumns({ onView, onEdit, onArchive, onRestore, onDelete, isNarrow: isBelowMd }),
    [onView, onEdit, onArchive, onRestore, onDelete, isBelowMd],
  );

  const confirmMeta = {
    archive: {
      title: "Archive report",
      message: "Are you sure you want to archive this report?",
      confirmText: "Archive",
      confirmColor: "primary",
    },
    restore: {
      title: "Restore report",
      message: "Restore this report?",
      confirmText: "Restore",
      confirmColor: "primary",
    },
    delete: {
      title: "Delete report",
      message:
        "Delete this report? It will be permanently removed after the retention period.",
      confirmText: "Delete",
      confirmColor: "error",
    },
  }[confirm.kind] ?? null;

  /**
   * Runs the confirmed §31.7 lifecycle action; the result toasts
   * exactly once (§60.5) and the cache refreshes through the §42.6
   * invalidation tags (ADR-033).
   * @param {('archive'|'restore'|'delete')} kind - The confirmed action.
   * @param {Object} report - The target report row.
   */
  const runMutation = async (kind, report) => {
    try {
      if (kind === "archive") {
        await archiveReport(report._id).unwrap();
        showToast("success", TOAST_CATALOGUE.report.archived);
      } else if (kind === "restore") {
        await restoreReport(report._id).unwrap();
        showToast("success", TOAST_CATALOGUE.report.restored);
      } else {
        await deleteReport(report._id).unwrap();
        showToast("success", TOAST_CATALOGUE.report.deleted);
      }
    } catch (mutationError) {
      showToast("error", mutationError?.message ?? TOAST_CATALOGUE.error.generic);
    }
  };

  const gridToolbarProps = {
    toolbar: {
      csvOptions: { disableToolbarButton: true },
      additionalExportMenuItems: (closeMenu) => (
        <ExportSelectedCsvItem onClose={closeMenu} selectedCount={selectedIds.length} />
      ),
    },
  };

  return (
    <Box>
      {isBelowMd ? null : (
        <MuiPageHeader
          eyebrow="Reports"
          title="Reports"
          subtitle="Your daily supervision reports"
        />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
        }}
      >
        <ButtonGroup size="medium" variant="outlined" aria-label="Report actions">
          <MuiButton
            variant="outlined"
            startIcon={
              <Badge
                badgeContent={0}
                color="primary"
                showZero={false}
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: 10,
                    height: 18,
                    minWidth: 18,
                    lineHeight: "18px",
                  },
                }}
              >
                <FilterListIcon fontSize="small" />
              </Badge>
            }
            onClick={() => setFilterOpen(true)}
          >
            Filter
          </MuiButton>
          {!isBelowMd && (
            <>
              <MuiButton
                variant={mode === "list" ? "contained" : "outlined"}
                startIcon={<ViewListIcon fontSize="small" />}
                onClick={() => setMode("list")}
              >
                List
              </MuiButton>
              <MuiButton
                variant={mode === "cards" ? "contained" : "outlined"}
                startIcon={<ViewModuleIcon fontSize="small" />}
                onClick={() => setMode("cards")}
              >
                Cards
              </MuiButton>
            </>
          )}
          <MuiButton
            variant="contained"
            color="success"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => navigate("/reports/new")}
          >
            Create
          </MuiButton>
        </ButtonGroup>
      </Box>

      {isError ? (
        <ListErrorContent message={error?.message} onRetry={refetch} />
      ) : showList ? (
        <>
          {selectedIds.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
              }}
            >
              <Chip
                size="small"
                label={`${selectedIds.length} selected`}
                color="primary"
                variant="outlined"
              />
              <MuiButton variant="text" onClick={() => setSelectedIds([])}>
                Clear
              </MuiButton>
            </Box>
          ) : null}
          <MuiDataGrid
            columns={columns}
            rows={docs}
            loading={loading}
            rowCount={data?.totalDocs ?? 0}
            page={page}
            pageSize={pageSize}
            onPaginationModelChange={({ page: nextPage, pageSize: nextLimit }) =>
              changePage(nextPage + 1, nextLimit)
            }
            onRowClick={(params) => onView(params.row)}
            onSelectionModelChange={setSelectedIds}
            slots={{
              loadingOverlay: () => <LoadingSpinner message="Loading reports" minHeight="300px" />,
              noRowsOverlay: () => (
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ListEmptyContent onNewReport={() => navigate("/reports/new")} />
                </Box>
              ),
            }}
            slotProps={gridToolbarProps}
          />
        </>
      ) : loading && docs.length === 0 ? (
        <Grid container spacing={2}>
          {[0, 1, 2, 3].map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : docs.length === 0 ? (
        <ListEmptyContent minHeight="320px" onNewReport={() => navigate("/reports/new")} />
      ) : (
        <>
          <Grid container spacing={2}>
            {docs.map((report) => (
              <Grid key={report._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ReportCard
                  report={report}
                  onView={onView}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              </Grid>
            ))}
          </Grid>
          {data ? (
            <MuiPagination
              page={data.page}
              count={data.totalPages}
              onChange={(_event, value) => setPage(value)}
              disabled={isFetching}
            />
          ) : null}
        </>
      )}

      <MuiDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter reports"
      >
        <Box sx={{ py: 3, px: 1 }}>
          <MuiEmptyState
            minHeight="auto"
            icon={<FilterListIcon />}
            title="Filter options coming soon"
            description="Filtering is not fully implemented yet — what to filter, single or multiple branches, pagination, and date vs date range are open questions (OQ-009)."
          />
        </Box>
      </MuiDialog>

      <MuiConfirmDialog
        open={Boolean(confirmMeta)}
        title={confirmMeta?.title}
        message={confirmMeta?.message}
        confirmText={confirmMeta?.confirmText}
        confirmColor={confirmMeta?.confirmColor}
        onClose={() => setConfirm({ kind: null, report: null })}
        onConfirm={() => {
          const target = confirm.report;
          const kind = confirm.kind;
          setConfirm({ kind: null, report: null });
          if (target && kind) {
            void runMutation(kind, target);
          }
        }}
      />
    </Box>
  );
}

export default Component;