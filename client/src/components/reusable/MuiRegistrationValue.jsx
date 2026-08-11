/**
 * @module components/reusable/MuiRegistrationValue
 *
 * The single renderer for registration-bearing values (§46.17, the
 * §21.10 registry surfaces). Renders the registration text/label
 * exactly as stored — never reformatted, never translated (ADR-033:
 * no second registration renderer anywhere). A missing registry key
 * renders the §46.4 not-applicable dash; **typeface follows the value
 * itself** — it never asserts the §43.5 content stack (the registered
 * value is data, §7.6).
 */
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";

/**
 * @param {Object} props
 * @param {string|null|undefined} props.value - Stored registration label.
 * @param {string} [props.variant] - Typography variant (default body2).
 * @param {Object} [props.sx] - Style overrides.
 */
export default function MuiRegistrationValue({ value, variant = "body2", sx, ...rest }) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <Typography variant={variant} sx={sx} {...rest}>
      {isEmpty ? "—" : value}
    </Typography>
  );
}

MuiRegistrationValue.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  variant: PropTypes.string,
  sx: PropTypes.object,
};