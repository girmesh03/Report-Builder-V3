/**
 * @module components/layout/PublicLayout
 *
 * The public root layout (§47.2): fixed public MuiAppbar (logo → `/`
 * leading, theme toggle + auth-aware actions trailing) over a
 * scrollable content area; outer `height: 100vh; overflow: hidden`
 * (§45.4). Below 600px the bar actions collapse to icons/tooltips.
 * During route transitions (`useNavigation().state === "loading"`)
 * the content area swaps to a centered `LoadingSpinner`; the app-bar
 * stays mounted. The content area renders a passed `children` in
 * place of the Outlet when one is given — the §59.4 composition
 * contract (NotFound selects this layout by auth and hands it the
 * 404 card as children).
 */
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Outlet, useNavigation } from "react-router";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiAppbar from "../reusable/MuiAppbar";
import MuiButton from "../reusable/MuiButton";
import LoadingSpinner from "../reusable/LoadingSpinner";
import { selectAuthStatus } from "../../redux/features/authSlice";
import { useLogout } from "../../hooks/useLogout";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function PublicLayout({ children }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));
  const status = useSelector(selectAuthStatus);
  const isAuthed = status === "authenticated";
  const logout = useLogout();
  const navigate = useNavigate();

  const actions = (
    <>
      <ThemeToggle />
      {isAuthed ? (
        <Tooltip title="Logout">
          <IconButton aria-label="Logout" onClick={logout} size="small">
            <LogoutOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : isBelowSm ? (
        <>
          <Tooltip title="Log in">
            <IconButton aria-label="Log in" onClick={() => navigate("/login")} size="small">
              <LoginOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sign up">
            <IconButton aria-label="Sign up" onClick={() => navigate("/register")} size="small">
              <PersonAddAltOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <MuiButton variant="text" onClick={() => navigate("/login")}>
            Log in
          </MuiButton>
          <MuiButton variant="contained" onClick={() => navigate("/register")}>
            Sign up
          </MuiButton>
        </>
      )}
    </>
  );

  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MuiAppbar variant="public" leading={<Logo />} actions={actions} />
      <Box sx={{ flexGrow: 1, overflowY: "auto", mt: theme.spacing(8) }}>
        {navigation.state === "loading" ? (
          <LoadingSpinner message="Loading…" minHeight="100%" />
        ) : (
          children ?? <Outlet />
        )}
      </Box>
    </Box>
  );
}
