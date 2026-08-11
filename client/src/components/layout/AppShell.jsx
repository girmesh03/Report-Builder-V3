/**
 * @module components/layout/AppShell
 *
 * The protected root layout (§47.3) — one shell for all authenticated
 * pages: left AppSidebar, right column (64px protected MuiAppbar —
 * search icon → GlobalSearchDialog, theme toggle, avatar menu; no
 * title; the sidebar-header menu icon toggles full/mini on md+, and
 * on xs/sm the app-bar's leading hamburger opens the temporary
 * overlay) over the scrollable content area. Outer `height: 100vh;
 * overflow: hidden` (§45.4). Content padding: 16px under 600px, 24px
 * at and above. During route transitions (`useNavigation().state ===
 * "loading"` — lazy module/loader/middleware fetch) the content area
 * swaps to a centered `LoadingSpinner`; the chrome stays mounted.
 * The content area renders a passed `children` in place of the
 * Outlet when one is given — the §59.4 composition contract
 * (NotFound selects this layout by auth and hands it the 404 card
 * as children).
 */
import { useState } from "react";
import { Outlet, useNavigation } from "react-router";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiAppbar from "../reusable/MuiAppbar";
import LoadingSpinner from "../reusable/LoadingSpinner";
import GlobalSearchDialog from "../reusable/GlobalSearchDialog";
import AppSidebar from "./AppSidebar";
import AvatarMenu from "./AvatarMenu";
import ThemeToggle from "./ThemeToggle";

export default function AppShell({ children }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("full");
  const [searchOpen, setSearchOpen] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const leading = isBelowMd ? (
    <Tooltip title="Open navigation">
      <IconButton
        aria-label="Open navigation"
        onClick={openDrawer}
        size="medium"
      >
        <MenuOutlinedIcon fontSize="medium" />
      </IconButton>
    </Tooltip>
  ) : null;

  const actions = (
    <>
      <Tooltip title="Search">
        <IconButton aria-label="Search" onClick={openSearch} size="small">
          <SearchOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <ThemeToggle />
      <AvatarMenu />
    </>
  );

  return (
    <Box sx={{ height: "100vh", overflow: "hidden", display: "flex" }}>
      <AppSidebar
        open={drawerOpen}
        onClose={closeDrawer}
        sidebarMode={sidebarMode}
        onToggle={() =>
          setSidebarMode((current) => (current === "full" ? "mini" : "full"))
        }
      />
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MuiAppbar variant="protected" leading={leading} actions={actions} />
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 1, md: 3 } }}>
          {navigation.state === "loading" ? (
            <LoadingSpinner message="Loading…" minHeight="100%" />
          ) : (
            children ?? <Outlet />
          )}
        </Box>
      </Box>
      <GlobalSearchDialog open={searchOpen} onClose={closeSearch} />
    </Box>
  );
}
