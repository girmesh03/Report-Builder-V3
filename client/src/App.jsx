/**
 * @module App
 *
 * The root app node (§41.4): theme → baseline → error boundary →
 * toast surface → routed outlets. The boundary's fallback is the
 * §60/§46.14 screen (AppErrorPage); its purpose is to catch render
 * crashes outside the router and show the same §60 surface — it never
 * unmounts the toast surface (always kept alive outside the boundary).
 */
import CssBaseline from "@mui/material/CssBaseline";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router";
import AppTheme from "./theme/AppTheme";
import AppErrorPage from "./components/AppErrorPage";
import AppToastContainer from "./components/reusable/AppToastContainer";

export default function App() {
  return (
    <AppTheme>
      <CssBaseline />
      <AppToastContainer />
      <ErrorBoundary FallbackComponent={AppErrorPage}>
        <Outlet />
      </ErrorBoundary>
    </AppTheme>
  );
}
