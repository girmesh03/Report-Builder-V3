/**
 * @module components/layout/AvatarMenu
 *
 * The §47.5 avatar dropdown of the protected app-bar: the user avatar
 * button (32px below 600px, 36px at and above 600px) opening a Menu
 * with **Profile** (`/profile`, §57) and **Logout** (the §47.6
 * flow via useLogout, then `<Navigate to="/login">`).
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useSelector } from "react-redux";
import { selectAuthUser } from "../../redux/features/authSlice";
import { useLogout } from "../../hooks/useLogout";

export default function AvatarMenu() {
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));
  const user = useSelector(selectAuthUser);
  const navigate = useNavigate();
  const logout = useLogout();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const size = isBelowSm ? 32 : 36;

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const goToProfile = () => {
    closeMenu();
    navigate("/profile");
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <IconButton
        aria-label="Account menu"
        onClick={openMenu}
        size="small"
        sx={{ p: 0.5 }}
      >
        <Avatar
          alt={user?.fullName ?? "User"}
          src={user?.avatar || undefined}
          sx={{ width: size, height: size, fontSize: size / 2 }}
        >
          {(user?.fullName ?? "U").charAt(0)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={goToProfile}>
          <ListItemIcon>
            <PersonOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
