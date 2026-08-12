/**
 * @module components/auth/BrandPanel
 *
 * The §48.3 Brand panel — the hero motif rendered statically: the
 * empty ruled dictation sheet (no waveform — §48.3 "static") beside
 * the page's claim. Visible only from lg (left column beside the
 * 480px card, §48.3 matrix); hidden below lg.
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RuledPaper from "../landing/RuledPaper";

export default function BrandPanel() {
  return (
    <Box sx={{ display: { xs: "none", lg: "block" } }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}
      >
        {import.meta.env.VITE_APP_NAME ?? "Report Builder"}
      </Typography>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        The daily supervision report, spoken in Amharic and delivered as a document.
      </Typography>
      <RuledPaper />
    </Box>
  );
}