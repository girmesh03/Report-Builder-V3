/**
 * @module components/reusable/GlobalSearchDialog
 *
 * The global search surface (§46.15, UX §59) — fully
 * self-contained: the shell passes only `open` and `onClose`. The
 * dialog owns the query (React Hook Form on MuiTextField — search
 * fires on Enter or the search action only, §9.6 no debounce) and
 * the idle → loading → done state machine. It drives the §39
 * endpoint lazily (useLazySearchAllQuery); results group by entity
 * (Reports, Branches) in accordion sections (§46.15), clicking a
 * result navigates to its detail page (§59.3); the content area
 * shows the two MuiEmptyState variants, centered full-height: the
 * search prompt while idle, "No results for {query}" when a done
 * run has no hits (§59.5, copy via the §60.6 catalogue). A server
 * error raises the §60 toast and the dialog keeps the last results
 * (§59.5) — when no results existed yet it falls back to idle.
 *
 * While typing, **nothing renders in React**: the field is
 * uncontrolled, and the clear button's visibility flips natively
 * via the `input:placeholder-shown` pseudo-class (empty input →
 * `visibility: hidden` on the reserved clear slot) — no state, no
 * re-render, no layout shift. Submit reads the live value with
 * `getValues`; clear/close use RHF `reset`, which writes the empty
 * value into the DOM input through the field's ref (the
 * MuiTextField ref lands on the real `<input>`). Fullscreen below
 * 900px — xs and sm are edge-to-edge with no border radius (the
 * app's small-screen convention; the centered paper only exists on
 * md+); below 768px landscape stays fullscreen too. Centered paper
 * 600px × 80vh at 900–1200px, 720px × 70vh above 1200px (§46.15).
 * Closes via the back arrow (clears +
 * resets + closes), Escape, or outside click.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
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
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiTextField from "./MuiTextField";
import LoadingSpinner from "./LoadingSpinner";
import MuiEmptyState from "./MuiEmptyState";
import { useLazySearchAllQuery } from "../../redux/features/searchEndpoints";
import { showToast } from "../../utils/toast.jsx";
import { TOAST_CATALOGUE } from "../../utils/constants";

const EMPTY_BUCKETS = Object.freeze({ reports: [], branches: [] });

/**
 * @param {Object} props
 * @param {boolean} props.open - Dialog visibility.
 * @param {Function} props.onClose - Close via back arrow / Escape / outside click.
 */
export default function GlobalSearchDialog({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
  const isLandscapeSmall = useMediaQuery(
    "(orientation: landscape) and (max-width: 767px)",
  );
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const fullscreen = isBelowMd || isLandscapeSmall;
  const [triggerSearch] = useLazySearchAllQuery();

  const { register, getValues, reset } = useForm({
    defaultValues: { search: "" },
    mode: "onSubmit",
  });

  const [phase, setPhase] = useState("idle");
  const [resultBuckets, setResultBuckets] = useState(EMPTY_BUCKETS);
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async () => {
    const query = getValues("search").trim();
    if (!query) {
      return;
    }
    const previousBuckets = resultBuckets;
    const previousPhase = phase;
    setPhase("loading");
    const result = await triggerSearch({ q: query }, true);
    if (result.error) {
      showToast("error", result.error.message);
      setResultBuckets(previousBuckets);
      setPhase(previousPhase === "loading" ? "idle" : previousPhase);
      return;
    }
    const buckets = { reports: [], branches: [] };
    for (const doc of result.data?.docs ?? []) {
      if (doc.type === "branch") {
        buckets.branches.push(doc);
      } else {
        buckets.reports.push(doc);
      }
    }
    setResultBuckets(buckets);
    setLastQuery(query);
    setPhase("done");
  };

  const clearSearch = () => {
    reset({ search: "" });
    setResultBuckets(EMPTY_BUCKETS);
    setLastQuery("");
    setPhase("idle");
  };

  const closeAndReset = () => {
    clearSearch();
    onClose();
  };

  const goTo = (item) => {
    clearSearch();
    onClose();
    if (item.type === "branch") {
      navigate(`/branches/${item.entityId}`);
    } else {
      navigate(`/reports/${item.entityId}`);
    }
  };

  const totalHits =
    (resultBuckets.reports?.length ?? 0) + (resultBuckets.branches?.length ?? 0);

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
              <ListItemButton key={item.entityId} onClick={() => goTo(item)}>
                <ListItemText
                  primary={item.title}
                  secondary={
                    item.type === "report" && item.status
                      ? `${item.subtitle} · ${item.status}`
                      : item.subtitle
                  }
                />
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
      onClose={closeAndReset}
      fullScreen={fullscreen}
      disableEnforceFocus
      disableRestoreFocus
      slotProps={{
        paper: fullscreen
          ? { sx: { borderRadius: 0 } }
          : {
              sx: {
                width: isLgUp ? 720 : 600,
                height: isLgUp ? "70vh" : "80vh",
                borderRadius: 3,
              },
            },
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
        <Tooltip title="Close search">
          <IconButton aria-label="Close search" onClick={closeAndReset} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <MuiTextField
          {...register("search")}
          autoFocus
          placeholder="Search reports and branches"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runSearch();
            }
          }}
          sx={{
            "& .MuiInputBase-root input:placeholder-shown ~ .search-clear-btn":
              { visibility: "hidden" },
          }}
          startAdornment={
            <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          }
          endAdornment={
            <>
              <Tooltip title="Clear search">
                <IconButton
                  className="search-clear-btn"
                  aria-label="Clear search"
                  onClick={clearSearch}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Search">
                <IconButton
                  aria-label="Search"
                  onClick={runSearch}
                  size="small"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          }
        />
      </Box>
      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          p: 0,
        }}
      >
        {phase === "loading" ? (
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
            }}
          >
            <LoadingSpinner message="Searching…" minHeight="auto" />
          </Box>
        ) : phase === "done" && totalHits > 0 ? (
          <Box sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0 }}>
            {renderSection("Reports", resultBuckets.reports)}
            {renderSection("Branches", resultBuckets.branches)}
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
            }}
          >
            <MuiEmptyState
              title={
                phase === "done"
                  ? TOAST_CATALOGUE.search.noResults.replace("{query}", lastQuery)
                  : "Search reports and branches"
              }
              description={
                phase === "done"
                  ? "Try a different keyword"
                  : "Type a query and press Enter or tap the search icon"
              }
              icon={
                phase === "done" ? (
                  <SearchOffOutlinedIcon />
                ) : (
                  <SearchIcon />
                )
              }
              minHeight="auto"
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

GlobalSearchDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};