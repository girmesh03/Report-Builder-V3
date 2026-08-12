/**
 * @module components/layout/ThemeToggle
 *
 * The §47.5 theme toggle — LightMode/DarkMode icon buttons switching
 * the §43.4 color scheme. Uses MUI's `useColorScheme()` (cssVariables
 * theme, AppTheme.jsx): `mode` is the applied scheme so the icon
 * re-renders on every flip; `setMode` writes the
 * `data-mui-color-scheme` selector and React state in one step. No
 * preference is persisted anywhere (§45.4 — no localStorage).
 */
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useColorScheme } from "@mui/material/styles";

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === "dark";

  const toggle = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <Tooltip title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
      <IconButton aria-label="Toggle color theme" onClick={toggle} size="small">
        {isDark ? (
          <LightModeOutlinedIcon fontSize="small" />
        ) : (
          <DarkModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
