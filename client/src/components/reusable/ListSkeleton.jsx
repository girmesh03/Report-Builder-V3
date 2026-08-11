/**
 * @module components/reusable/ListSkeleton
 *
 * §46.14-styled placeholder for list surfaces (the dashboard KPIs
 * §49): a vertical stack of card-shaped bars with a leading icon dot.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * @param {Object} props
 * @param {number} [props.items] - Number of placeholder items (default 3).
 */
export default function ListSkeleton({ items = 3 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1 }}>
      {Array.from({ length: items }).map((_, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="62%" height={16} />
            <Skeleton variant="text" width="38%" height={12} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

ListSkeleton.propTypes = {
  items: PropTypes.number,
};