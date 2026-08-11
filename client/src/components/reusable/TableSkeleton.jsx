/**
 * @module components/reusable/TableSkeleton
 *
 * §46.14-styled placeholder for table surfaces (reports list §50,
 * branches list §56): a header row of short bars plus a stack of full
 * data rows. Pages render their §45.7 loading slot with this — never
 * duplicate skeleton markup.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * @param {Object} props
 * @param {number} [props.rows] - Number of placeholder rows (default 6).
 * @param {number} [props.columns] - Number of placeholder columns (default 4).
 */
export default function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={`${88 - index * 8}%`}
            height={18}
            sx={{ flex: 1 }}
          />
        ))}
      </Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", gap: 2, py: 0.75 }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${92 - colIndex * 10}%`}
              height={14}
              sx={{ flex: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};