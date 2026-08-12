/**
 * @module components/landing/CtaBand
 *
 * The §48.2 CTA band: one closing ask above the footer. Matrix:
 * full-width buttons below sm, contained and centered from md.
 * Chrome copy English (§7.6); links to the §48 Register/Login pages.
 */
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiButton from "../reusable/MuiButton";

export default function CtaBand() {
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 2,
        py: { xs: 4, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto", textAlign: "center" }}>
        <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
          Today&apos;s report is one walk away.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: "auto" }}>
          One email signs you up — your first report is ready when your walk is.
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MuiButton
            variant="contained"
            size="medium"
            onClick={() => navigate("/register")}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Sign up
          </MuiButton>
          <MuiButton
            variant="outlined"
            size="medium"
            onClick={() => navigate("/login")}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Log in
          </MuiButton>
        </Box>
      </Box>
    </Box>
  );
}