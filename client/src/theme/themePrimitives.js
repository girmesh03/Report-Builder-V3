/**
 * Theme primitives: committed color scales, typography (chrome Inter,
 * content Ethiopic stack), shape, shadow ramp, and layout config
 * (§43.2–§43.5). The palette here is the scaffold's committed token
 * set; components and pages consume roles only — never these
 * primitives (§44.1).
 *
 * @module theme/themePrimitives
 */

import { alpha } from "@mui/material/styles";

/**
 * Brand blue scale — interactive elements, selection, focus (§43.2).
 * @type {readonly Object<number, string>}
 */
export const brand = Object.freeze({
  50: "hsl(210, 100%, 95%)",
  100: "hsl(210, 100%, 92%)",
  200: "hsl(210, 100%, 80%)",
  300: "hsl(210, 100%, 65%)",
  400: "hsl(210, 98%, 48%)",
  500: "hsl(210, 98%, 42%)",
  600: "hsl(210, 98%, 55%)",
  700: "hsl(210, 100%, 35%)",
  800: "hsl(210, 100%, 16%)",
  900: "hsl(210, 100%, 21%)",
});

/**
 * Paper neutrals scale — surfaces, text, dividers (§43.2).
 * @type {readonly Object<number, string>}
 */
export const gray = Object.freeze({
  50: "hsl(220, 35%, 97%)",
  100: "hsl(220, 30%, 94%)",
  200: "hsl(220, 20%, 88%)",
  300: "hsl(220, 20%, 80%)",
  400: "hsl(220, 20%, 65%)",
  500: "hsl(220, 20%, 42%)",
  600: "hsl(220, 20%, 35%)",
  700: "hsl(220, 20%, 25%)",
  800: "hsl(220, 30%, 6%)",
  900: "hsl(220, 35%, 3%)",
});

/**
 * Success scale — success role only (§43.2, §44.4).
 * @type {readonly Object<number, string>}
 */
export const green = Object.freeze({
  50: "hsl(120, 80%, 98%)",
  100: "hsl(120, 75%, 94%)",
  200: "hsl(120, 75%, 87%)",
  300: "hsl(120, 61%, 77%)",
  400: "hsl(120, 44%, 53%)",
  500: "hsl(120, 59%, 30%)",
  600: "hsl(120, 70%, 25%)",
  700: "hsl(120, 75%, 16%)",
  800: "hsl(120, 84%, 10%)",
  900: "hsl(120, 87%, 6%)",
});

/**
 * Orange/amber scale — reserved for audio (recording, timing,
 * warning surfaces); never a brand accent (§43.2).
 * @type {readonly Object<number, string>}
 */
export const orange = Object.freeze({
  50: "hsl(45, 100%, 97%)",
  100: "hsl(45, 92%, 90%)",
  200: "hsl(45, 94%, 80%)",
  300: "hsl(45, 90%, 65%)",
  400: "hsl(45, 90%, 40%)",
  500: "hsl(45, 90%, 35%)",
  600: "hsl(45, 91%, 25%)",
  700: "hsl(45, 94%, 20%)",
  800: "hsl(45, 95%, 16%)",
  900: "hsl(45, 93%, 12%)",
});

/**
 * Red scale — error role only (§43.2, §44.4).
 * @type {readonly Object<number, string>}
 */
export const red = Object.freeze({
  50: "hsl(0, 100%, 97%)",
  100: "hsl(0, 92%, 90%)",
  200: "hsl(0, 94%, 80%)",
  300: "hsl(0, 90%, 65%)",
  400: "hsl(0, 90%, 40%)",
  500: "hsl(0, 90%, 30%)",
  600: "hsl(0, 91%, 25%)",
  700: "hsl(0, 94%, 18%)",
  800: "hsl(0, 95%, 12%)",
  900: "hsl(0, 93%, 6%)",
});

/**
 * Light and dark color schemes (§43.4). Roles are the only palette
 * surface consumed outside theme/.
 * @type {readonly Object<string, Object>}
 */
export const colorSchemes = Object.freeze({
  light: Object.freeze({
    palette: Object.freeze({
      primary: Object.freeze({
        light: brand[200],
        main: brand[400],
        dark: brand[700],
        contrastText: brand[50],
      }),
      info: Object.freeze({
        light: brand[100],
        main: brand[300],
        dark: brand[600],
        contrastText: gray[50],
      }),
      warning: Object.freeze({
        light: orange[300],
        main: orange[400],
        dark: orange[800],
      }),
      error: Object.freeze({
        light: red[300],
        main: red[400],
        dark: red[800],
      }),
      success: Object.freeze({
        light: green[300],
        main: green[400],
        dark: green[800],
      }),
      grey: gray,
      divider: alpha(gray[300], 0.4),
      background: Object.freeze({
        default: "hsl(0, 0%, 99%)",
        paper: "hsl(220, 35%, 97%)",
      }),
      text: Object.freeze({
        primary: gray[800],
        secondary: gray[600],
        warning: orange[400],
      }),
      action: Object.freeze({
        hover: alpha(gray[200], 0.2),
        selected: alpha(gray[200], 0.3),
      }),
      baseShadow:
        "hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px",
    }),
  }),
  dark: Object.freeze({
    palette: Object.freeze({
      primary: Object.freeze({
        contrastText: brand[50],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      }),
      info: Object.freeze({
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      }),
      warning: Object.freeze({
        light: orange[400],
        main: orange[500],
        dark: orange[700],
      }),
      error: Object.freeze({
        light: red[400],
        main: red[500],
        dark: red[700],
      }),
      success: Object.freeze({
        light: green[400],
        main: green[500],
        dark: green[700],
      }),
      grey: gray,
      divider: alpha(gray[700], 0.6),
      background: Object.freeze({
        default: gray[900],
        paper: "hsl(220, 30%, 7%)",
      }),
      text: Object.freeze({
        primary: "hsl(0, 0%, 100%)",
        secondary: gray[400],
      }),
      action: Object.freeze({
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      }),
      baseShadow:
        "hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px",
    }),
  }),
});

/**
 * Chrome type scale (§43.3) plus the §43.5 content-stack addition.
 * Font sizes are literal rem transcriptions of the committed px scale
 * (§43.8: no createTheme outside AppTheme.jsx).
 * @type {readonly Object<string, Object|string>}
 */
export const typography = Object.freeze({
  fontFamily: "Inter, sans-serif",
  h1: Object.freeze({
    fontSize: "3rem",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
  }),
  h2: Object.freeze({
    fontSize: "2.25rem",
    fontWeight: 600,
    lineHeight: 1.2,
  }),
  h3: Object.freeze({
    fontSize: "1.875rem",
    fontWeight: 600,
    lineHeight: 1.2,
  }),
  h4: Object.freeze({
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.5,
  }),
  h5: Object.freeze({
    fontSize: "1.25rem",
    fontWeight: 600,
  }),
  h6: Object.freeze({
    fontSize: "1.125rem",
    fontWeight: 600,
  }),
  subtitle1: Object.freeze({
    fontSize: "1.125rem",
  }),
  subtitle2: Object.freeze({
    fontSize: "0.875rem",
    fontWeight: 500,
  }),
  body1: Object.freeze({
    fontSize: "0.875rem",
  }),
  body2: Object.freeze({
    fontSize: "0.875rem",
    fontWeight: 400,
  }),
  caption: Object.freeze({
    fontSize: "0.75rem",
    fontWeight: 400,
  }),
  /**
   * Content stack (§43.5): report body, transcription, chat. Amharic
   * runs render through the Ethiopic face; Latin runs inside the
   * content fall back through Inter. Leading is lifted for Ethiopic
   * ascender/descender clearance (design decision, P2).
   * @type {Object}
   */
  contentBody: Object.freeze({
    fontFamily: "'Noto Serif Ethiopic', 'Inter', sans-serif",
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.75,
  }),
});

/**
 * Committed geometry (§43.3).
 * @type {Object}
 */
export const shape = Object.freeze({
  borderRadius: 8,
});

/**
 * MUI default elevation ramp, indices 2–24, transcribed verbatim from
 * `createTheme().shadows` — kept as primitives so no createTheme call
 * lives outside AppTheme.jsx (§43.8). Index 1 is the committed
 * baseShadow; elevation appears on overlays only (§44.6).
 * @type {readonly string[]}
 */
const defaultShadowRamp = Object.freeze([
  "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)",
  "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)",
  "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
  "0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)",
  "0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)",
  "0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)",
  "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
  "0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)",
  "0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)",
  "0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)",
  "0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)",
  "0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)",
  "0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)",
  "0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)",
  "0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)",
  "0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)",
  "0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)",
  "0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)",
  "0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)",
  "0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)",
  "0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)",
  "0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)",
  "0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)",
]);

/**
 * The committed shadow ramp: none, baseShadow (index 1 — the only
 * elevation on overlays), then the MUI default ramp (§43.3, §44.6).
 * @type {readonly string[]}
 */
export const shadows = Object.freeze([
  "none",
  "var(--template-palette-baseShadow)",
  ...defaultShadowRamp,
]);

/**
 * Layout measures (§45.4, §47).
 * @type {readonly Object<string, number|string>}
 */
export const layoutConfig = Object.freeze({
  drawerWidth: 240,
  headerHeight: 64,
  mobileBreakpoint: "md",
  /**
   * Readable measure for centered content (the wizard's step content
   * and summary ribbon, §52): max-width in px, `mx: auto` at use
   * sites; below this width the box is naturally full-width.
   */
  contentMaxWidth: 680,
});