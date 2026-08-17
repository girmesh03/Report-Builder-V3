/**
 * @module components/report/ExportMenu
 *
 * The export menu of the completed report (§58 provisional — the
 * round lands the full export suite): a circular actions button at
 * the report body card's header top right that opens the menu —
 * Print / Save as PDF (the print surface of §58.3),
 * Download TXT (the §58.3 export payload as a plain-text file),
 * and the XLSX/CSV affordances disabled with their coming-soon
 * titles until the §58 exports round. Both live sinks share one
 * on-demand fetch of the export payload (the query is skipped until
 * the menu is opened or an item is chosen) so the printed page and
 * the downloaded file always describe the same report.
 */
import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DownloadIcon from "@mui/icons-material/Download";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import IosShareIcon from "@mui/icons-material/IosShare";
import GridOnIcon from "@mui/icons-material/GridOn";
import TableViewIcon from "@mui/icons-material/TableView";
import ReportPrint from "./print/ReportPrint";
import { useExportContentQuery } from "../../redux/features/reportsEndpoints";
import { WIZARD, TOAST_CATALOGUE } from "../../utils/constants";
import { showToast } from "../../utils/toast";

/**
 * The TXT sink: the §58.3 payload as a plain-text file — the
 * official text, then the identifying line.
 * @param {Object} payload
 */
const buildTxt = (payload) => {
  const lines = [
    payload?.content ?? "",
    "",
    `— ${[payload?.reportDate, payload?.supervisorName, payload?.branchNames?.join(", ")]
      .filter(Boolean)
      .join(" · ")}`,
  ];
  return lines.join("\n");
};

/**
 * @param {Object} props
 * @param {string|null} props.reportId - The completed report to export.
 */
export default function ExportMenu({ reportId }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [printPayload, setPrintPayload] = useState(null);
  const { refetch } = useExportContentQuery(reportId, { skip: true });

  const closeMenu = useCallback(() => setAnchorEl(null), []);
  const openMenu = useCallback((event) => setAnchorEl(event.currentTarget), []);

  const fetchPayload = async () => {
    try {
      const result = await refetch();
      return result.data ?? null;
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
      return null;
    }
  };

  const handlePrint = async () => {
    closeMenu();
    const payload = await fetchPayload();
    if (payload) {
      setPrintPayload(payload);
    }
  };

  const handleTxt = async () => {
    closeMenu();
    const payload = await fetchPayload();
    if (!payload) {
      return;
    }
    const blob = new Blob([buildTxt(payload)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${reportId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("success", TOAST_CATALOGUE.export.ready);
  };

  return (
    <>
      <Tooltip title={WIZARD.report.exportLabel}>
        <span>
          <IconButton
            size="small"
            onClick={openMenu}
            aria-label={WIZARD.report.exportLabel}
            sx={{ width: 32, height: 32 }}
          >
            <IosShareIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <PrintOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{WIZARD.report.exportMenu.print}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleTxt}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{WIZARD.report.exportMenu.txt}</ListItemText>
        </MenuItem>
        <MenuItem disabled title={WIZARD.report.exportMenu.xlsxComing}>
          <ListItemIcon>
            <GridOnIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {WIZARD.report.exportMenu.xlsx}
            <Box component="span" sx={{ color: "text.disabled", ml: 1 }}>
              {WIZARD.report.exportMenu.xlsxComing}
            </Box>
          </ListItemText>
        </MenuItem>
        <MenuItem disabled title={WIZARD.report.exportMenu.csvComing}>
          <ListItemIcon>
            <TableViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {WIZARD.report.exportMenu.csv}
            <Box component="span" sx={{ color: "text.disabled", ml: 1 }}>
              {WIZARD.report.exportMenu.csvComing}
            </Box>
          </ListItemText>
        </MenuItem>
      </Menu>
      {printPayload ? (
        <ReportPrint
          payload={printPayload}
          onPrinted={() => setPrintPayload(null)}
        />
      ) : null}
    </>
  );
}