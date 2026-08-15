/**
 * @module components/report/VisitedBranchesDialog
 *
 * The visited-branch picker of step 1 (§52): a MuiDialog with a
 * title, opened by the step's "Add visited branches" button. It is
 * conditionally mounted by the step — each open reseeds its draft
 * from the committed visits, so Cancel/backdrop/Escape discards
 * (the draft is dialog-local) and Apply commits. Rules:
 *
 * - The main branch is part of the visits whenever any branch is
 *   selected, and cannot be removed while others remain — its row is
 *   locked-checked and carries the auto day pair (locked pickers
 *   that follow the day times live).
 * - One visit pairs with the day; two or more visits carry their own
 *   required, ordered pairs — Apply stays disabled until every
 *   selected branch's pair is complete and ordered (inline errors
 *   appear after a branch's times are touched).
 * - The payload keeps list order, main first.
 *
 * Branches come from the page's shared query (RTK cache — "fetches
 * on open" is a warm-cache read); loading and empty states are
 * rendered inside the dialog. Focus enters the dialog on mount and
 * the opening control is refocused by the step on close (the app's
 * MuiDialog does not restore focus itself).
 */
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Avatar from "@mui/material/Avatar";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MuiButton from "../reusable/MuiButton";
import MuiDialog from "../reusable/MuiDialog";
import MuiEmptyState from "../reusable/MuiEmptyState";
import MuiTimePicker from "../reusable/MuiTimePicker";
import ListSkeleton from "../reusable/ListSkeleton";
import { WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {Array<Object>} props.branches - Active branches (DTO docs).
 * @param {boolean} [props.branchesLoading] - True while the first fetch runs.
 * @param {string|null} props.mainBranch - The main branch _id.
 * @param {Object|null} props.clockIn - Day-pair start (dayjs).
 * @param {Object|null} props.clockOut - Day-pair end (dayjs).
 * @param {Array<Object>} props.visits - Committed visits (seed).
 * @param {Function} props.onClose - Discards the draft and closes.
 * @param {Function} props.onApply - Commits the visits array (main first).
 */
export default function VisitedBranchesDialog({
  branches,
  branchesLoading = false,
  mainBranch,
  clockIn,
  clockOut,
  visits,
  onClose,
  onApply,
}) {
  const [draft, setDraft] = useState(() => {
    const map = {};
    visits.forEach((visit) => {
      if (visit.branch !== mainBranch) {
        map[visit.branch] = { clockIn: visit.clockIn, clockOut: visit.clockOut };
      }
    });
    return map;
  });
  const [touched, setTouched] = useState(() => new Set());
  const rootRef = useRef(null);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const hasOthers = Object.keys(draft).length > 0;

  const toggle = (branchId) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (next[branchId]) {
        delete next[branchId];
      } else {
        next[branchId] = { clockIn: null, clockOut: null };
      }
      return next;
    });
  };

  const setTime = (branchId, key, value) => {
    setDraft((prev) => ({ ...prev, [branchId]: { ...prev[branchId], [key]: value } }));
    setTouched((prev) => new Set(prev).add(branchId));
  };

  const othersComplete = Object.keys(draft).every((branchId) => {
    const entry = draft[branchId];
    return entry.clockIn && entry.clockOut && entry.clockOut.isAfter(entry.clockIn);
  });
  const applyReady = !hasOthers || othersComplete;

  const handleApply = () => {
    if (!applyReady) {
      return;
    }
    const selected = branches.filter((branch) => draft[branch._id]);
    const next = hasOthers
      ? [
          { branch: mainBranch, clockIn, clockOut },
          ...selected.map((branch) => ({
            branch: branch._id,
            clockIn: draft[branch._id].clockIn,
            clockOut: draft[branch._id].clockOut,
          })),
        ]
      : [];
    onApply(next);
  };

  return (
    <MuiDialog
      title={WIZARD.visited.pickerTitle}
      onClose={onClose}
      actions={
        <>
          <MuiButton variant="text" onClick={onClose}>
            {WIZARD.visited.cancel}
          </MuiButton>
          <MuiButton onClick={handleApply} disabled={!applyReady}>
            {WIZARD.visited.apply}
          </MuiButton>
        </>
      }
    >
      <Box ref={rootRef} tabIndex={-1} sx={{ outline: "none", p: 1.5 }}>
        {branchesLoading && branches.length === 0 ? (
          <ListSkeleton items={4} />
        ) : branches.length === 0 ? (
          <MuiEmptyState
            icon={<StorefrontOutlinedIcon />}
            title={WIZARD.visited.emptyTitle}
            description={WIZARD.visited.emptyDescription}
            minHeight="200px"
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {branches.map((branch) => {
              const isMain = branch._id === mainBranch;
              const checked = isMain ? hasOthers : Boolean(draft[branch._id]);
              const entry = draft[branch._id];
              const branchTouched = touched.has(branch._id);
              const pairInvalid =
                checked &&
                !isMain &&
                branchTouched &&
                (!entry.clockIn || !entry.clockOut || !entry.clockOut.isAfter(entry.clockIn));

              return (
                <Box
                  key={branch._id}
                  sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Checkbox
                      checked={checked}
                      disabled={isMain}
                      onChange={() => toggle(branch._id)}
                      inputProps={{ "aria-label": branch.name }}
                    />
                    <Avatar sx={{ width: 32, height: 32 }}>{branch.name.charAt(0)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {branch.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {branch.location}
                      </Typography>
                    </Box>
                    {isMain ? (
                      <Box
                        sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}
                        title={WIZARD.visited.mainLockHint}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {WIZARD.visited.mainLockHint}
                        </Typography>
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </Box>
                    ) : null}
                  </Box>
                  {checked ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        mt: 1,
                      }}
                    >
                      <MuiTimePicker
                        value={isMain ? clockIn : entry.clockIn}
                        onChange={(value) => setTime(branch._id, "clockIn", value)}
                        disabled={isMain}
                        error={Boolean(pairInvalid && (!entry.clockIn || !entry.clockOut))}
                      />
                      <MuiTimePicker
                        value={isMain ? clockOut : entry.clockOut}
                        onChange={(value) => setTime(branch._id, "clockOut", value)}
                        disabled={isMain}
                        error={Boolean(
                          pairInvalid &&
                            (entry.clockIn
                              ? !entry.clockOut || !entry.clockOut.isAfter(entry.clockIn)
                              : false),
                        )}
                      />
                    </Box>
                  ) : null}
                  {pairInvalid ? (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                    >
                      {!entry.clockIn || !entry.clockOut
                        ? WIZARD.step1.visitTimesRequired
                        : WIZARD.step1.visitClockOutAfterClockIn}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </MuiDialog>
  );
}