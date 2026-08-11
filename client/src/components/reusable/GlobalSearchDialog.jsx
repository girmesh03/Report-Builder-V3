/**
 * @module components/reusable/GlobalSearchDialog
 *
 * The global search surface (§46.15, UX §59) — standalone, does not
 * use MuiDialog's actions slot. Results group by entity (Reports,
 * Branches) in accordion sections; fullscreen below 600px (and below
 * 768px landscape), centered paper at larger sizes. The data layer
 * (§39 endpoint via §42) is wired by the owning shell — this
 * component renders the surface and emits the query.
 */
import { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * @param {Object} props
 * @param {boolean} props.open - Dialog visibility.
 * @param {Function} props.onClose - Close via back arrow / Escape / backdrop.
 * @param {string} [props.initialQuery] - Pre-filled query.
 * @param {Object} [props.results] - `{ reports: [], branches: [] }` result buckets.
 * @param {boolean} [props.loading] - Loading state.
 * @param {Function} [props.onSearch] - Fires on Enter / action click (query) — no debounce (§9.6).
 * @param {Function} [props.onSubmitResult] - Navigates when a result is chosen.
 */
export default function GlobalSearchDialog({
  open,
  onClose,
  initialQuery = "",
  results = { reports: [], branches: [] },
  loading = false,
  onSearch,
  onSubmitResult,
}) {
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));
  const isLandscapeSmall = useMediaQuery(
    "(orientation: landscape) and (max-width: 767px)",
  );
  const fullscreen = isBelowSm || isLandscapeSmall;
  const [query, setQuery] = useState(initialQuery);

  const submit = () => {
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  const totalHits =
    (results.reports?.length ?? 0) + (results.branches?.length ?? 0);

  const renderSection = (label, items) => {
    if (!items || items.length === 0) {
      return null;
    }
    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">{label}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List>
            {items.map((item) => (
              <ListItemButton
                key={item._id}
                onClick={() => onSubmitResult && onSubmitResult(item)}
              >
                <ListItemText primary={item.title} secondary={item.subtitle} />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullscreen}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableRestoreFocus
      slotProps={{
        paper: fullscreen
          ? { sx: { borderRadius: 0 } }
          : { sx: { borderRadius: 3, height: "80vh", maxHeight: 720 } },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <IconButton aria-label="Close search" onClick={onClose}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <InputBase
          autoFocus
          placeholder="Search reports and branches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
          startAdornment={
            <SearchIcon
              fontSize="small"
              sx={{ mr: 1, color: "text.secondary" }}
            />
          }
          sx={{ flex: 1 }}
        />
      </Box>
      <DialogContent dividers sx={{ maxHeight: 400, overflowY: "auto", p: 0 }}>
        {loading ? (
          <LoadingSpinner minHeight="320px" />
        ) : query.trim() && !loading ? (
          totalHits === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              No results found
            </Typography>
          ) : (
            <Box>
              {renderSection("Reports", results.reports)}
              {renderSection("Branches", results.branches)}
            </Box>
          )
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            Type a query and press Enter to search
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

GlobalSearchDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialQuery: PropTypes.string,
  results: PropTypes.shape({
    reports: PropTypes.array,
    branches: PropTypes.array,
  }),
  loading: PropTypes.bool,
  onSearch: PropTypes.func,
  onSubmitResult: PropTypes.func,
};
