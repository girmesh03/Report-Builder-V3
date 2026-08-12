/**
 * @module pages/Landing
 *
 * The §48.2 Landing page (`/`), browsable by guests and
 * authenticated sessions alike (§48.1/§47.2). Round-9b composition
 * (owner review): the ruled-desk hero with the persisting §43.2
 * waveform, the branches strip (the customer's own names, managed
 * from Branches), the Record → Verify → Deliver strip, the CTA band,
 * and the footer (product name `VITE_APP_NAME`, §10.5; copyright).
 * Sections are fixed — no loading or data states; navigation
 * failures toast only on the destination (§48.2 states).
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Hero from "../components/landing/Hero";
import BranchStrip from "../components/landing/BranchStrip";
import HowItWorks from "../components/landing/HowItWorks";
import CtaBand from "../components/landing/CtaBand";

export function Component() {
  return (
    <>
      <Hero />
      <BranchStrip />
      <HowItWorks />
      <CtaBand />
      <Box component="footer" sx={{ px: 2, py: 3, maxWidth: 1100, mx: "auto", width: "100%" }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
          © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME ?? "Report Builder"}
        </Typography>
      </Box>
    </>
  );
}

export default Component;