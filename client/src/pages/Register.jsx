/**
 * @module pages/Register
 *
 * The §48.4 Register page (`/register`) — guests only (PublicRoute,
 * §41.5): the same centered paper-card pattern as Login with the
 * header-strip eyebrow "Create your account" + title "Sign up"
 * (§46.12), `RegisterForm` (email + password + client-only
 * confirmation), the shared OAuth entry, and the login link.
 * Success lands on `/login` (decision 11, §41.2) — `state.from`
 * from a prior guard redirect is deliberately ignored; the card
 * matrix matches §48.3 (brand panel from lg, stacked full-width
 * actions).
 */
import { Link as RouterLink } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import MuiPageHeader from "../components/reusable/MuiPageHeader";
import RegisterForm from "../components/auth/RegisterForm";
import GoogleOAuthButton from "../components/auth/GoogleOAuthButton";
import BrandPanel from "../components/auth/BrandPanel";

export function Component() {
  return (
    <Box sx={{ px: 2, py: { xs: 2, sm: 4 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          gap: 5,
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: "calc(100vh - 112px)", sm: "calc(100vh - 160px)" },
        }}
      >
        <Box sx={{ flex: "1 1 0", maxWidth: 480, minWidth: 0, display: { xs: "none", lg: "block" } }}>
          <BrandPanel />
        </Box>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: { sm: 420, lg: 480 },
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <MuiPageHeader eyebrow="Create your account" title="Sign up" />
          <RegisterForm />
          <Box sx={{ mt: 2 }}>
            <GoogleOAuthButton />
          </Box>
          <Box sx={{ mt: 2.5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link component={RouterLink} to="/login">
                Log in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Component;