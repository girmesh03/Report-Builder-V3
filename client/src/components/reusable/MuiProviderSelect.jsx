/**
 * @module components/reusable/MuiProviderSelect
 *
 * The AI-provider selector for the correction surface (§46.17,
 * round-5 amendment; round-8 amendment: label-less — the caption row
 * is gone, the Select carries `aria-label` only, per the round-8
 * dialog review). Fed from the single-source provider registry —
 * `AI_PROVIDERS` plus the `AI_PROVIDER_LABELS` display map (§11.4) —
 * never a hard-coded list. Width is the host's call: inline beside
 * the correction controls at lg/md, below them at sm, full width at
 * xs (§54.7 responsive pass) — the selector never disappears at any
 * breakpoint.
 */
import PropTypes from "prop-types";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { AI_PROVIDERS, AI_PROVIDER_LABELS, WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {string} props.value - The selected provider id (one of `AI_PROVIDERS`).
 * @param {Function} props.onChange - Selection change → the host's provider state.
 * @param {boolean} [props.disabled] - Disabled while a correction is in flight.
 */
export default function MuiProviderSelect({ value, onChange, disabled = false }) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      fullWidth
      aria-label={WIZARD.modes.aiProvider}
      sx={{ minWidth: 140, bgcolor: "background.paper" }}
    >
      {AI_PROVIDERS.map((providerId) => (
        <MenuItem key={providerId} value={providerId}>
          {AI_PROVIDER_LABELS[providerId]}
        </MenuItem>
      ))}
    </Select>
  );
}

MuiProviderSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};