/**
 * @module components/reusable/MuiAppbar
 *
 * The single app-bar (§46.11) for PublicLayout (public variant,
 * full-width, fixed) and AppShell (protected variant, 64px, inside the
 * content column). Section-level behaviors (which actions render,
 * navigation) belong to §47 — this component only frames the bar.
 * Height 64px constant (§45.4).
 */
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

/**
 * @param {Object} props
 * @param {('public'|'protected')} [props.variant] - Layout variant.
 * @param {ReactNode} [props.leading] - Left-aligned slot (e.g. the logo, §47.2).
 * @param {ReactNode} [props.actions] - Right-aligned actions slot.
 * @param {Object} [props.sx] - Style overrides.
 */
export default function MuiAppbar({
  variant = "protected",
  leading,
  actions,
  sx,
}) {
  const theme = useTheme();
  const isProtected = variant === "protected";
  const height = theme.spacing(8);

  return (
    <AppBar
      position={isProtected ? "static" : "fixed"}
      elevation={0}
      color="transparent"
      sx={{
        height,
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...(isProtected && { width: "100%" }),
        ...sx,
      }}
    >
      <Toolbar sx={{ minHeight: height, height, px: 2, gap: 1 }}>
        {leading}
        <Box sx={{ flexGrow: 1 }} />
        {actions}
      </Toolbar>
    </AppBar>
  );
}

MuiAppbar.propTypes = {
  variant: PropTypes.oneOf(["public", "protected"]),
  leading: PropTypes.node,
  actions: PropTypes.node,
  sx: PropTypes.object,
};
