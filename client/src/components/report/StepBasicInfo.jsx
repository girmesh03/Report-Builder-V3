/**
 * @module components/report/StepBasicInfo
 *
 * Step 1 of the report-creation flow (§52) — Basic info & Visits:
 * the Ethiopian report date (button-style picker, defaults to
 * Ethiopian today), the day's clockIn/clockOut pair (24h), the main
 * branch (active branches only), and the visited-branch picker. The
 * form instance lives in the owning page (react-hook-form, onBlur
 * mode); this component receives `control` and renders the fields
 * through Controllers whose `rules.validate` carry the step's manual
 * validators — the None→error protocol stays intact (a global
 * resolver would paint every field red on the first blur). Errors
 * surface with the section summary line and the offending field's
 * own message; helper space is reserved so text never shifts the
 * layout.
 *
 * Visits rules (committed by the picker, main first): the main visit
 * always carries the auto day pair — it is re-synced whenever the
 * day times or the main branch change — and visited-branch times are
 * only entered for two or more visits.
 *
 * `focusFirstError` is exposed via the forwarded ref so the page can
 * move focus to the first problem field when Next fails validation.
 */
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Controller,
  useController,
  useFormState,
  useWatch,
} from "react-hook-form";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import MuiButton from "../reusable/MuiButton";
import MuiDatePicker from "../reusable/MuiDatePicker";
import MuiSelect from "../reusable/MuiSelect";
import MuiTimePicker from "../reusable/MuiTimePicker";
import VisitedBranchesDialog from "./VisitedBranchesDialog";
import { PICKER_TIME_FORMAT, WIZARD } from "../../utils/constants";
import {
  validateBranch,
  validateClockIn,
  validateClockOut,
  validateDate,
  validateVisits,
} from "../../utils/wizardValidation";

const FIELD_ORDER = ["date", "clockIn", "clockOut", "branch", "visits"];

/**
 * One labeled field: caption label above, the control, and a
 * reserved error line (empty text stays in the layout so error
 * messages never shift the form).
 * @param {Object} props
 * @param {string} props.label - Field label.
 * @param {ReactNode} props.children - The control.
 * @param {Object|null} [props.error] - RHF field error.
 * @param {Object} [props.ref] - Focus target for validation failures (React 19 ref-as-prop).
 */
function FieldBlock({ label, children, error, ref }) {
  return (
    <Box ref={ref} tabIndex={-1} sx={{ outline: "none" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {children}
      <Typography
        variant="caption"
        color="error"
        aria-hidden={!error}
        sx={{ display: "block", mt: 0.5, minHeight: "1.25em" }}
      >
        {error?.message ?? ""}
      </Typography>
    </Box>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.control - RHF control from the owning page.
 * @param {Array<Object>} props.branches - Active branches (DTO docs).
 * @param {Function} props.branchNameOf - Branch _id → name resolver.
 */
const StepBasicInfo = forwardRef(function StepBasicInfo(
  { control, branches, branchNameOf },
  ref,
) {
  const { errors } = useFormState({ control });
  const values = useWatch({ control });
  const { field: visitsField } = useController({
    control,
    name: "visits",
    rules: { validate: validateVisits },
  });
  const [visitedOpen, setVisitedOpen] = useState(false);
  const dateRef = useRef(null);
  const clockInRef = useRef(null);
  const clockOutRef = useRef(null);
  const branchRef = useRef(null);
  const visitsRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      focusFirstError() {
        const first = FIELD_ORDER.find((key) => errors[key]);
        const targets = {
          date: dateRef,
          clockIn: clockInRef,
          clockOut: clockOutRef,
          branch: branchRef,
          visits: visitsRef,
        };
        if (first) {
          targets[first].current?.focus();
        }
      },
    }),
    [errors, dateRef, clockInRef, clockOutRef, branchRef, visitsRef],
  );

  const visits = values.visits ?? [];
  const clockIn = values.clockIn;
  const clockOut = values.clockOut;
  const branchOptions = branches.map((branch) => ({
    value: branch._id,
    label: branch.name,
  }));

  const syncMainVisit = (key, value) => {
    if (visits.length === 0) {
      return;
    }
    visitsField.onChange(
      visits.map((visit, index) =>
        index === 0 ? { ...visit, [key]: value } : visit,
      ),
    );
  };

  const closeVisited = () => {
    setVisitedOpen(false);
    visitsRef.current?.focus();
  };

  const applyVisits = (next) => {
    visitsField.onChange(next);
    closeVisited();
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {Object.keys(errors).length > 0 ? (
        <Typography variant="body2" color="error">
          {WIZARD.sectionSummaryLine}
        </Typography>
      ) : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock
            label={WIZARD.fieldLabels.date}
            error={errors.date}
            ref={dateRef}
          >
            <Controller
              name="date"
              control={control}
              rules={{ validate: validateDate }}
              render={({ field }) => (
                <MuiDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(errors.date)}
                />
              )}
            />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldBlock
            label={WIZARD.fieldLabels.branch}
            error={errors.branch}
            ref={branchRef}
          >
            <Controller
              name="branch"
              control={control}
              rules={{ validate: validateBranch }}
              render={({ field }) => (
                <MuiSelect
                  value={field.value}
                  onChange={(event) => {
                    const next = event.target.value;
                    field.onChange(next);
                    if (visits.length > 0) {
                      visitsField.onChange(
                        visits.map((visit, index) =>
                          index === 0 ? { ...visit, branch: next } : visit,
                        ),
                      );
                    }
                  }}
                  options={branchOptions}
                  placeholder={WIZARD.step1.branchPlaceholder}
                  error={Boolean(errors.branch)}
                />
              )}
            />
          </FieldBlock>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box ref={visitsRef} tabIndex={-1} sx={{ outline: "none" }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {WIZARD.fieldLabels.visited}
            </Typography>
            <MuiButton
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setVisitedOpen(true)}
              fullWidth
            >
              {WIZARD.visited.button}
            </MuiButton>
            <Typography
              variant="caption"
              color="error"
              aria-hidden={!errors.visits}
              sx={{ display: "block", mt: 0.5, minHeight: "1.25em" }}
            >
              {errors.visits?.message ?? ""}
            </Typography>
            {visits.length === 0 ? null : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {visits.map((visit) => (
                  <Chip
                    key={visit.branch}
                    size="small"
                    variant="outlined"
                    label={`${branchNameOf(visit.branch)} — ${
                      visit.clockIn?.format(PICKER_TIME_FORMAT) ?? "–"
                    } – ${visit.clockOut?.format(PICKER_TIME_FORMAT) ?? "–"}`}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <FieldBlock
            label={WIZARD.fieldLabels.clockIn}
            error={errors.clockIn}
            ref={clockInRef}
          >
            <Controller
              name="clockIn"
              control={control}
              rules={{ validate: validateClockIn }}
              render={({ field }) => (
                <MuiTimePicker
                  value={field.value}
                  error={Boolean(errors.clockIn)}
                  onChange={(value) => {
                    field.onChange(value);
                    syncMainVisit("clockIn", value);
                  }}
                />
              )}
            />
          </FieldBlock>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <FieldBlock
            label={WIZARD.fieldLabels.clockOut}
            error={errors.clockOut}
            ref={clockOutRef}
          >
            <Controller
              name="clockOut"
              control={control}
              rules={{ validate: (value) => validateClockOut(value, clockIn) }}
              render={({ field }) => (
                <MuiTimePicker
                  value={field.value}
                  error={Boolean(errors.clockOut)}
                  onChange={(value) => {
                    field.onChange(value);
                    syncMainVisit("clockOut", value);
                  }}
                />
              )}
            />
          </FieldBlock>
        </Grid>
      </Grid>
      {visitedOpen ? (
        <VisitedBranchesDialog
          mainBranch={values.branch}
          clockIn={clockIn}
          clockOut={clockOut}
          visits={visits}
          onClose={closeVisited}
          onApply={applyVisits}
        />
      ) : null}
    </Box>
  );
});

export default StepBasicInfo;
