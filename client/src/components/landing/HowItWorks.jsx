/**
 * @module components/landing/HowItWorks
 *
 * The §48.2 "How it works" strip — the §1.5 working loop in chrome
 * copy: Record → Verify → Deliver. Three plain paper cards
 * (round-9 composition, owner review — no times, no Amharic):
 * a numbered step (01/02/03 — a real sequence), an icon, a
 * subtitle1 title, one body2 line each; horizontal arrows between
 * the columns on md+. Below the strip, a quiet hairline band carries
 * the branch-management promise — the customer's own names live in
 * his reports.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

const STEPS = Object.freeze([
  {
    number: "01",
    icon: <MicOutlinedIcon fontSize="small" />,
    title: "Record",
    description:
      "Walk your branches and speak what you see — voice notes in any mix of Amharic and English.",
  },
  {
    number: "02",
    icon: <FactCheckOutlinedIcon fontSize="small" />,
    title: "Verify",
    description:
      "Read the transcription at your desk, correct anything before it sends.",
  },
  {
    number: "03",
    icon: <DescriptionOutlinedIcon fontSize="small" />,
    title: "Deliver",
    description:
      "The formatted report, ready in the eight lines your manager reads.",
  },
]);

const Step = ({ step }) => (
  <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider", flex: { md: "1 1 0" }, minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {step.number}
      </Typography>
      <Box component="span" sx={{ display: "flex", color: "text.secondary" }}>
        {step.icon}
      </Box>
    </Box>
    <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
      {step.title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {step.description}
    </Typography>
  </Box>
);

Step.propTypes = {
  step: PropTypes.shape({
    number: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

const Arrow = () => (
  <Box
    aria-hidden="true"
    sx={{
      display: { xs: "none", md: "flex" },
      alignItems: "center",
      color: "text.secondary",
      opacity: 0.5,
      px: 0.5,
    }}
  >
    <ArrowForwardOutlinedIcon fontSize="small" />
  </Box>
);

export default function HowItWorks() {
  return (
    <Box component="section" sx={{ px: 2, pb: { xs: 4, md: 6 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 0.5 }}
      >
        How it works
      </Typography>
      <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
        Record, verify, deliver — every report moves the same way.
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: { md: "stretch" },
        }}
      >
        <Step step={STEPS[0]} />
        <Arrow />
        <Step step={STEPS[1]} />
        <Arrow />
        <Step step={STEPS[2]} />
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          mt: 3,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box component="span" sx={{ display: "flex", color: "text.secondary", mt: 0.25 }}>
          <StorefrontOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle2" component="p">
            Your branches, your names.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add a branch once, pick it on any day, and keep it in every report —
            managed any time from the Branches page.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}