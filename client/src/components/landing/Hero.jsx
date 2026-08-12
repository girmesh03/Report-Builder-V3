/**
 * @module components/landing/Hero
 *
 * The §48.2 Landing signature (round-9b composition, owner review):
 * English eyebrow + headline for the supervisor who will build his
 * own report, two CTAs, and the cardless ruled desk with the §43.2
 * waveform — the day's report, not yet written, being spoken; the
 * trace persists after its first display. Layout per the §48.2
 * matrix: stacked on xs (header above the desk), 560px centered on
 * sm, two-column from md, max-width 1100px lg+.
 */
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiButton from "../reusable/MuiButton";
import RuledPaper from "./RuledPaper";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      sx={{
        px: 2,
        pb: { xs: 4, md: 6 },
        pt: { xs: 3, md: 5 },
        maxWidth: 1100,
        mx: "auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 5 },
          maxWidth: { xs: "100%", sm: 560, md: "none" },
          mx: { xs: "auto", md: 0 },
          alignItems: { md: "center" },
        }}
      >
        <Box sx={{ flex: "1 1 45%", minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 1 }}
          >
            Daily supervision reports, in Amharic
          </Typography>
          <Typography
            variant="h1"
            component="h2"
            sx={{ fontSize: { xs: "2.25rem", md: "3rem" }, mb: 1.5 }}
          >
            Speak your day. Leave with the report.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mb: 3 }}>
            Your daily supervision report — written in Amharic, from your own
            words, under your own branch names.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
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
        <Box sx={{ flex: "1 1 55%", minWidth: 0 }}>
          <RuledPaper waveform />
        </Box>
      </Box>
    </Box>
  );
}