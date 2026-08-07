/**
 * @module theme/AppTheme
 */
import { useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import {
  inputsCustomizations,
  dataDisplayCustomizations,
  feedbackCustomizations,
  navigationCustomizations,
  surfacesCustomizations,
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
} from "./customizations";

import { colorSchemes, typography, shadows, shape } from "./themePrimitives";

/**
 * App-wide MUI theme provider.
 *
 * @param {{ children: React.ReactNode }} props - Theme provider props.
 * @returns {JSX.Element} Theme provider wrapper.
 * @throws {never} This component does not throw.
 */
function AppTheme(props) {
  const { children } = props;
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: "data-mui-color-scheme",
          cssVarPrefix: "template",
        },
        colorSchemes,
        typography,
        shadows,
        shape,
        components: {
          ...inputsCustomizations,
          ...dataDisplayCustomizations,
          ...feedbackCustomizations,
          ...navigationCustomizations,
          ...surfacesCustomizations,
          ...chartsCustomizations,
          ...dataGridCustomizations,
          ...datePickersCustomizations,
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

export default AppTheme;
