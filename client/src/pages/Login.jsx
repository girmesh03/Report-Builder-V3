/**
 * @module pages/Login
 *
 * The §48.3 Login page (`/login`) — guests only (PublicRoute,
 * §41.5): the centered paper card (surface role, §43.2/§44.6 —
 * the spec's paper card is kept here; the scaffold ban affects the
 * 404 only) with the header-strip eyebrow "Welcome back" + title
 * "Log in" (§46.12), `LoginForm`, the shared OAuth entry, and the
 * sign-up link. Also the converge point of the §41.5 guard redirect
 * (`state.from`) and of the §42 expiry redirect — an expiry arrival
 * never toasts (401 silent-rule, §42.3). From lg a static brand
 * panel (hero motif) sits left of the 480px card (§48.3 matrix);
 * the card is full-width without radius on xs, 420px centered from
 * sm.
 */
import { useLocation, Link as RouterLink } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import MuiPageHeader from "../components/reusable/MuiPageHeader";
import LoginForm from "../components/auth/LoginForm";
import GoogleOAuthButton from "../components/auth/GoogleOAuthButton";
import BrandPanel from "../components/auth/BrandPanel";

export function Component() {
  const location = useLocation();
  const from = location.state?.from;

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
          <MuiPageHeader eyebrow="Welcome back" title="Log in" />
          <LoginForm from={from} />
          <Box sx={{ mt: 2 }}>
            <GoogleOAuthButton />
          </Box>
          <Box sx={{ mt: 2.5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{" "}
              <Link component={RouterLink} to="/register">
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Component;