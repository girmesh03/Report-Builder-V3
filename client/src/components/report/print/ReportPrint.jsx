/**
 * @module components/report/print/ReportPrint
 *
 * The print surface of the export menu (§58 provisional): a block
 * rendered ONLY for the print medium (`display: none` on screen, the
 * MUI `print` pseudo breakpoint flips it visible in `@media print`) —
 * the report's official text with its identifying line. The payload is
 * the §58.3 export shape (`content`, `reportDate`, `supervisorName`,
 * `branchNames`) so the printed page and the TXT download describe the
 * same report. `window.print()` fires once after mount; the
 * `afterprint` event tears the surface down so a second print
 * re-mounts it cleanly.
 */
import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * @param {Object} props
 * @param {Object|null} props.payload - The §58.3 export payload.
 * @param {Function} props.onPrinted - Tear-down after the print dialog
 *   closes (`afterprint`).
 */
export default function ReportPrint({ payload, onPrinted }) {
  useEffect(() => {
    window.print();
    window.addEventListener("afterprint", onPrinted);
    return () => window.removeEventListener("afterprint", onPrinted);
  }, [onPrinted]);

  return (
    <Box
      sx={{
        display: "none",
        print: { display: "block" },
        fontFamily: "inherit",
      }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {payload?.reportDate ?? ""}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {[
          payload?.supervisorName,
          payload?.branchNames?.join(", "),
        ]
          .filter(Boolean)
          .join(" · ")}
      </Typography>
      <Box
        sx={{ mt: 2 }}
        dangerouslySetInnerHTML={{ __html: payload?.content ?? "" }}
      />
    </Box>
  );
}