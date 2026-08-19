/**
 * @module components/reusable/MuiDataGrid
 *
 * Every data table (§46.8) — the Reports list §50 and the Branches
 * list §56. Server-driven: `rowCount` is the server `totalDocs`;
 * pagination model flows through the owning page. CSV export (via the
 * Grid toolbar) exports the selected rows — the §58 export surface of
 * the lists.
 */
import PropTypes from "prop-types";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * @param {Object} props
 * @param {Array} props.columns - Domain columns (reports.js / branches.js).
 * @param {Array} props.rows - Grid rows (each with `_id`).
 * @param {boolean} [props.loading] - Loading state (custom overlay).
 * @param {number} props.rowCount - Server `totalDocs` (§46.8).
 * @param {('server'|'client')} [props.paginationMode] - Server-driven by contract.
 * @param {number} [props.page] - Current page (1-based).
 * @param {number} [props.pageSize] - Page size.
 * @param {Array<number>} [props.pageSizeOptions] - Selectable page sizes (default [10,25,50,100]).
 * @param {Array} [props.rowSelectionModel] - Controlled checkbox selection ids
 * (array form at the wrapper boundary — internally translated to the v9
 * `{ type, ids }` model, which is the only shape v9.11 accepts; the change
 * callback is unwrapped back to an array).
 * @param {Function} [props.onPaginationModelChange] - Pagination callback.
 * @param {Function} [props.onRowClick] - Row click navigation.
 * @param {Function} [props.onSelectionModelChange] - Selection callback (receives an array of ids).
 * @param {Object} [props.slots] - Slot overrides.
 * @param {Object} [props.slotProps] - Slot props; `toolbar` per the v9 built-in toolbar.
 * @param {Object} [props.sx] - Style overrides; default height 400.
 */
export default function MuiDataGrid({
  columns,
  rows,
  loading = false,
  rowCount,
  paginationMode = "server",
  page,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  rowSelectionModel,
  onPaginationModelChange,
  onRowClick,
  onSelectionModelChange,
  slots,
  slotProps,
  sx,
  ...rest
}) {
  const selectionModel = useMemo(
    () =>
      rowSelectionModel
        ? { type: "include", ids: new Set(rowSelectionModel) }
        : undefined,
    [rowSelectionModel],
  );

  return (
    <Box sx={{ height: 400, width: "100%", ...sx }}>
      <DataGrid
        columns={columns}
        rows={rows}
        getRowId={(row) => row._id}
        loading={loading}
        rowCount={rowCount}
        paginationMode={paginationMode}
        paginationModel={{
          page: (page ?? 1) - 1,
          pageSize: pageSize ?? 10,
        }}
        onPaginationModelChange={onPaginationModelChange}
        onRowClick={onRowClick}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={(model) =>
          onSelectionModelChange?.(model ? [...model.ids] : [])
        }
        pageSizeOptions={pageSizeOptions}
        autoHeight={false}
        showToolbar
        slots={slots}
        slotProps={{
          ...slotProps,
          toolbar: {
            ...(slotProps?.toolbar ?? {}),
            printOptions: {
              disableToolbarButton: true,
              ...(slotProps?.toolbar?.printOptions ?? {}),
            },
          },
        }}
        sx={{
          "& .MuiDataGrid-toolbarContainer": {
            padding: 1,
          },
        }}
        {...rest}
      />
    </Box>
  );
}

MuiDataGrid.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  rowCount: PropTypes.number,
  paginationMode: PropTypes.oneOf(["server", "client"]),
  page: PropTypes.number,
  pageSize: PropTypes.number,
  pageSizeOptions: PropTypes.array,
  rowSelectionModel: PropTypes.array,
  onPaginationModelChange: PropTypes.func,
  onRowClick: PropTypes.func,
  onSelectionModelChange: PropTypes.func,
  slots: PropTypes.object,
  slotProps: PropTypes.object,
  sx: PropTypes.object,
};
