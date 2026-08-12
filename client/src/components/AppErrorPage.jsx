/**
 * @module components/AppErrorPage
 *
 * The render-error surface of §60 (ADR-025, §41.4): a full-viewport
 * centered fallback with the §46.14 copy ("Something went wrong" +
 * "Reload") and a `Reload` button that reloads the window. It is
 * slotted as both the router-level `errorElement` and the App.jsx
 * error-boundary fallback.
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiButton from "./reusable/MuiButton";

export default function AppErrorPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Typography variant="h5">Something went wrong</Typography>
      <MuiButton variant="contained" onClick={() => window.location.reload()}>
        Reload
      </MuiButton>
    </Box>
  );
}
