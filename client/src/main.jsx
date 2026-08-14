/**
 * @module main
 *
 * Entry point (§41.4): fonts → Redux store (RTK) → date adapter →
 * router. The boot preload fires the `getCurrentUser` query (§42.7)
 * before first render so the auth status resolves in the background
 * while the router mounts.
 *
 * Routing (§41.3):
 *
 * - Landing `/`: PublicLayout, browsable by guests AND authenticated
 *   sessions (the auth-aware bar shows Logout, §47.2/§41.5).
 * - Guest branch: PublicRoute → PublicLayout (login, register) —
 *   guests only; authenticated sessions are redirected to
 *   `/dashboard` (§41.5, decision 4).
 * - Protected branch: ProtectedRoute → AppShell (Dashboard, Reports,
 *   ReportDetails, Branches, BranchDetails, Profile) —
 *   authenticated only.
 * - `*` → NotFound (selects its own layout, §41.5) — the catch-all
 *   ships **statically** (like AppErrorPage) so an unmatched URL
 *   never enters a lazy-loading window: the §59.4 404 renders
 *   instantly, reload or SPA-navigate (§41.3).
 *
 * Page modules are loaded with React Router v8's lazy-property form
 * (`lazy: { Component: … }`, §41.3 "Component + lazy") using literal
 * import specifiers so Vite's static analysis stays intact. The guard
 * wrappers (PublicRoute, ProtectedRoute) are synchronous redirects
 * that ship **statically** as elements — like AppErrorPage and
 * NotFound — so a branch can never render unguarded in a lazy window.
 *
 * The root route's `hydrateFallbackElement` renders while any
 * matched lazy module loads on first paint (RR v8 renders `null`
 * without it) — the full-page LoadingSpinner keeps the user
 * informed; App (theme/baseline/toast) stays mounted beneath it.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { EthiopianDateAdapter } from "./utils/ethiopianDateAdapter";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-serif-ethiopic/400.css";
import "@fontsource/noto-serif-ethiopic/500.css";
import "@fontsource/noto-serif-ethiopic/600.css";
import "@fontsource/noto-serif-ethiopic/700.css";
import App from "./App.jsx";
import store from "./redux/app/store.js";
import { apiSlice } from "./redux/features/apiSlice.js";
import AppErrorPage from "./components/AppErrorPage.jsx";
import LoadingSpinner from "./components/reusable/LoadingSpinner.jsx";
import NotFound from "./pages/NotFound.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import PublicRoute from "./components/layout/PublicRoute.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

store.dispatch(
  apiSlice.endpoints.getCurrentUser.initiate(undefined, { subscribe: false }),
);

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <AppErrorPage />,
    hydrateFallbackElement: (
      <LoadingSpinner message="Initializing..." minHeight="90vh" />
    ),
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: "/",
            lazy: {
              Component: () =>
                import("./pages/Landing.jsx").then((m) => m.Component),
            },
          },
        ],
      },
      {
        element: <PublicRoute />,
        children: [
          {
            element: <PublicLayout />,
            children: [
              {
                path: "/login",
                lazy: {
                  Component: () =>
                    import("./pages/Login.jsx").then((m) => m.Component),
                },
              },
              {
                path: "/register",
                lazy: {
                  Component: () =>
                    import("./pages/Register.jsx").then((m) => m.Component),
                },
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                path: "/dashboard",
                lazy: {
                  Component: () =>
                    import("./pages/Dashboard.jsx").then((m) => m.Component),
                },
              },
              {
                path: "/reports",
                lazy: {
                  Component: () =>
                    import("./pages/Reports.jsx").then((m) => m.Component),
                },
              },
              {
                path: "/reports/new",
                lazy: {
                  Component: () =>
                    import("./pages/ReportNew.jsx").then((m) => m.Component),
                },
              },
              {
                path: "/reports/:reportId",
                lazy: {
                  Component: () =>
                    import("./pages/ReportDetails.jsx").then(
                      (m) => m.Component,
                    ),
                },
              },
              {
                path: "/branches",
                lazy: {
                  Component: () =>
                    import("./pages/Branches.jsx").then((m) => m.Component),
                },
              },
              {
                path: "/branches/:branchId",
                lazy: {
                  Component: () =>
                    import("./pages/BranchDetails.jsx").then(
                      (m) => m.Component,
                    ),
                },
              },
              {
                path: "/profile",
                lazy: {
                  Component: () =>
                    import("./pages/Profile.jsx").then((m) => m.Component),
                },
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <LocalizationProvider dateAdapter={EthiopianDateAdapter}>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </Provider>
  </StrictMode>,
);
