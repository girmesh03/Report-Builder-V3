/**
 * @module components/landing/BranchStrip
 *
 * The §48.2 branches strip (round-9b composition, owner review): the
 * branch-management promise carried by many small storefront icons —
 * the visitor's own branches, added once, picked daily, kept in every
 * report, managed any time from Branches. Plain chrome copy; no
 * Amharic, no fields, no sample data.
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

const BRANCH_ICONS = Object.freeze([
  { opacity: 0.25 },
  { opacity: 0.35 },
  { opacity: 0.55 },
  { opacity: 0.7, accent: true },
  { opacity: 0.45 },
  { opacity: 0.3 },
  { opacity: 0.25 },
  { opacity: 0.2 },
]);

export default function BranchStrip() {
  return (
    <Box
      component="section"
      sx={{ px: 2, pb: { xs: 4, md: 6 }, maxWidth: 1100, mx: "auto", width: "100%" }}
    >
      <Box
        sx={{
          py: 3,
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 0.5 }}
        >
          Your branches, your names
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 520, mx: "auto" }}>
          Add a branch once — it appears in every report, ready to pick. Manage
          them any time from Branches.
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            flexWrap: "wrap",
          }}
        >
          {BRANCH_ICONS.map(({ opacity, accent }, index) => (
            <Box
              key={index}
              component="span"
              sx={{
                display: "flex",
                color: accent ? "primary.main" : "text.secondary",
                opacity,
              }}
            >
              <StorefrontOutlinedIcon fontSize="small" />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}