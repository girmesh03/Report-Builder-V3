/**
 * @module components/reusable/FormSkeleton
 *
 * §46.14-styled placeholder for the wizard steps (§52): per-field
 * label + input bars stacked in form columns.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * @param {Object} props
 * @param {number} [props.fields] - Number of placeholder fields (default 4).
 * @param {number} [props.columns] - Responsive column count on md+ (default 2).
 */
export default function FormSkeleton({ fields = 4, columns = 2 }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: `repeat(${columns}, 1fr)` },
        gap: 2,
        p: 1,
      }}
    >
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index}>
          <Skeleton variant="text" width="36%" height={14} />
          <Skeleton variant="rounded" height={40} />
        </Box>
      ))}
    </Box>
  );
}

FormSkeleton.propTypes = {
  fields: PropTypes.number,
  columns: PropTypes.number,
};