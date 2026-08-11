/**
 * @module components/reusable/MessageSkeleton
 *
 * §46.14-styled placeholder for the conversation (§55): alternating
 * message bubbles with avatar dots and text bars.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * @param {Object} props
 * @param {number} [props.messages] - Number of placeholder bubbles (default 4).
 */
export default function MessageSkeleton({ messages = 4 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1 }}>
      {Array.from({ length: messages }).map((_, index) => {
        const outgoing = index % 2 === 1;
        return (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: outgoing ? "flex-end" : "flex-start",
            }}
          >
            {!outgoing ? <Skeleton variant="circular" width={28} height={28} /> : null}
            <Box
              sx={{
                maxWidth: "68%",
                width: `${56 + (index % 3) * 10}%`,
              }}
            >
              <Skeleton variant="rounded" height={36} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

MessageSkeleton.propTypes = {
  messages: PropTypes.number,
};