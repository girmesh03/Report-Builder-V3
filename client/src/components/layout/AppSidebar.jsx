/**
 * @module components/layout/AppSidebar
 *
 * The protected sidebar (§47.4). The mini mode exists **only on md+
 * (≥ 900px)**: a permanent drawer, 240px full by default; the header
 * menu icon toggles it to the 64px mini rail (icons + tooltips only;
 * header shows the menu icon and nothing else). On xs/sm (< 900px)
 * the sidebar is a 240px temporary overlay drawer — opened by the
 * app-bar hamburger (§47.3, xs/sm only), closing on backdrop click,
 * nav selection, or Escape. The temporary drawer's header shows the
 * logo only: no menu toggle (the app-bar hamburger owns xs/sm).
 *
 * Nav: Dashboard / Reports / Branches / Profile; the selected entry
 * gets the `primary.main` 8% tint, `primary.main` text/icon, a 3px
 * `primary.main` left border, and 600 weight (§47.4). Logout is the
 * bottom entry: neutral resting state, `error.main` tint/color on
 * hover only (§47.4).
 */
import { Link, useLocation } from "react-router";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLogout } from "../../hooks/useLogout";
import Logo from "./Logo";

const NAV_ITEMS = Object.freeze([
  Object.freeze({
    label: "Dashboard",
    to: "/dashboard",
    Icon: SpaceDashboardOutlinedIcon,
  }),
  Object.freeze({
    label: "Reports",
    to: "/reports",
    Icon: DescriptionOutlinedIcon,
  }),
  Object.freeze({
    label: "Branches",
    to: "/branches",
    Icon: AccountTreeOutlinedIcon,
  }),
  Object.freeze({ label: "Profile", to: "/profile", Icon: PersonOutlinedIcon }),
]);

function useSelectedStyles() {
  const theme = useTheme();
  return {
    "&.Mui-selected": {
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      color: "primary.main",
      "& .MuiListItemIcon-root": { color: "primary.main" },
      "& .MuiListItemText-primary": { fontWeight: 600 },
      borderLeft: `3px solid ${theme.palette.primary.main}`,
    },
  };
}

function SidebarNav({ full, onNavigate }) {
  const selectedStyles = useSelectedStyles();
  const location = useLocation();
  return (
    <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
      {NAV_ITEMS.map(({ label, to, Icon }) => (
        <Tooltip key={to} title={full ? "" : label} placement="right">
          <ListItemButton
            component={Link}
            to={to}
            onClick={onNavigate}
            selected={location.pathname === to}
            sx={{
              mb: 0.5,
              mx: 1,
              width: "auto",
              borderRadius: 1,
              justifyContent: full ? "flex-start" : "center",
              px: full ? 1.5 : 0,
              minHeight: 40,
              ...selectedStyles,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 0, mr: full ? 1.5 : 0, justifyContent: "center" }}
            >
              <Icon fontSize="small" />
            </ListItemIcon>
            {full && <ListItemText primary={label} />}
          </ListItemButton>
        </Tooltip>
      ))}
    </Box>
  );
}

function SidebarHeader({ full, onToggle, toggleEnabled = true }) {
  return (
    <Box
      sx={{
        height: (theme) => theme.spacing(8),
        display: "flex",
        alignItems: "center",
        px: full ? 1 : 0,
        justifyContent: full ? "flex-start" : "center",
      }}
    >
      {toggleEnabled ? (
        <IconButton
          aria-label="Toggle sidebar"
          onClick={onToggle}
          size="medium"
        >
          <MenuOutlinedIcon fontSize="medium" />
        </IconButton>
      ) : null}
      {full && <Logo />}
    </Box>
  );
}

function SidebarFooter({ full }) {
  const logout = useLogout();
  const theme = useTheme();
  return (
    <Box sx={{ pb: 1 }}>
      <Divider />
      <Tooltip title={full ? "" : "Logout"} placement="right">
        <ListItemButton
          onClick={logout}
          sx={{
            mt: 1,
            mx: 1,
            width: "auto",
            borderRadius: 1,
            justifyContent: full ? "flex-start" : "center",
            px: full ? 1.5 : 0,
            minHeight: 40,
            color: "text.secondary",
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: "error.main",
              "& .MuiListItemIcon-root": { color: "error.main" },
              "& .MuiListItemText-primary": { color: "error.main" },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: full ? 1.5 : 0,
              justifyContent: "center",
              color: "action.active",
            }}
          >
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {full && <ListItemText primary="Logout" />}
        </ListItemButton>
      </Tooltip>
    </Box>
  );
}

export default function AppSidebar({ open, onClose, sidebarMode, onToggle }) {
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
  const isMini = !isBelowMd && sidebarMode === "mini";
  const drawerWidth = isMini ? 64 : 240;

  const body = (full, toggleEnabled) => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <SidebarHeader
        full={full}
        onToggle={onToggle}
        toggleEnabled={toggleEnabled}
      />
      <Divider />
      <SidebarNav full={full} onNavigate={onClose} />
      <SidebarFooter full={full} />
    </Box>
  );

  if (isBelowMd) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        disableEnforceFocus
        disableRestoreFocus
        sx={{
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            backgroundImage: "none",
            backgroundColor: "background.paper",
          },
        }}
      >
        {body(true, false)}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      {body(!isMini, true)}
    </Drawer>
  );
}
