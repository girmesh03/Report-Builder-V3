/**
 * @module pages/NotFound
 *
 * The route-not-found fallback (§59.4): rendered inside whichever
 * layout is active — AppShell for authenticated sessions, PublicLayout
 * for anonymous ones (no AppShell chrome for anonymous users). The
 * chosen layout receives the 404 card as `children` and renders it
 * in place of its Outlet (§47.2/§47.3 composition contract). A
 * centered Box (bgcolor `background.default` + divider border — no
 * Paper/Card surface, user-directed): the `notFound_404.svg`
 * illustration, "Page not found" title, "This page doesn't exist or
 * was moved" subtitle, and two actions: **Home** (contained,
 * `HomeOutlined` start icon) to `/` and **Back** (outlined,
 * `ArrowBackOutlined` start icon) via `navigate(-1)`.
 */
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import notFound404 from "../assets/notFound_404.svg";
import LoadingSpinner from "../components/reusable/LoadingSpinner";
import MuiButton from "../components/reusable/MuiButton";
import AppShell from "../components/layout/AppShell";
import PublicLayout from "../components/layout/PublicLayout";
import { selectAuthStatus } from "../redux/features/authSlice";

function NotFoundCard() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          p: 4,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src={notFound404}
          alt=""
          aria-hidden="true"
          sx={{ width: "100%", maxWidth: 480, height: "auto", mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          Page not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          This page doesn't exist or was moved
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <MuiButton
            variant="contained"
            startIcon={<HomeOutlinedIcon />}
            onClick={() => navigate("/")}
          >
            Home
          </MuiButton>
          <MuiButton
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate(-1)}
          >
            Back
          </MuiButton>
        </Box>
      </Box>
    </Box>
  );
}

export default function NotFound() {
  const status = useSelector(selectAuthStatus);

  if (status === "initializing") {
    return <LoadingSpinner />;
  }

  return status === "authenticated" ? (
    <AppShell>
      <NotFoundCard />
    </AppShell>
  ) : (
    <PublicLayout>
      <NotFoundCard />
    </PublicLayout>
  );
}

export function Component() {
  return <NotFound />;
}
