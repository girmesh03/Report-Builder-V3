/**
 * @module components/reusable/MuiPagination
 *
 * Server-driven list pagination (§46.7). `count` is the server
 * `totalPages` — never computed client-side (§27, §46.7). Page size
 * comes from the owning list (PAGINATION_DEFAULT_LIMIT / _MAX_LIMIT,
 * §11.5).
 */
import PropTypes from "prop-types";
import Pagination from "@mui/material/Pagination";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * @param {Object} props
 * @param {number} props.page - Current page (1-based).
 * @param {number} props.count - `totalPages` from the server (§46.7).
 * @param {Function} props.onChange - Page change handler.
 * @param {boolean} [props.disabled] - Disables navigation.
 */
export default function MuiPagination({ page, count, onChange, disabled = false }) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Pagination
      page={page}
      count={count}
      onChange={onChange}
      disabled={disabled}
      size={isCompact ? "small" : "medium"}
      shape="rounded"
      sx={{ display: "flex", justifyContent: "center", py: 2 }}
    />
  );
}

MuiPagination.propTypes = {
  page: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};