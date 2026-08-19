/**
 * @module components/report/GenerateCard
 *
 * The generation desk of the report step (§52.8) — the `transcribed`
 * posture, shown while the report body does not exist yet: a card
 * with the report title header, the step's empty state ("The day is
 * heard"), the generate act (§34.2) and the hint line. The act is
 * server-guarded (the mock 403s before the report is `transcribed`);
 * on success the report becomes `reviewed` with the generated body in
 * `latest`, the query refetch seeds the body card, and the
 * `generation.ready` toast fires (§11.5 catalogue). The card never
 * renders an editor — "read-only until generation" means NO editor
 * pre-generation, not a `readOnly` editor (§54.2 posture).
 */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MuiButton from "../reusable/MuiButton";
import MuiEmptyState from "../reusable/MuiEmptyState";
import { WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {boolean} props.generating - The generate act is in flight
 *   (the act + the wizard's Next both busy).
 * @param {Function} props.onGenerate - The generate act (§34.2).
 */
export default function GenerateCard({ generating, onGenerate }) {
  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardHeader
        avatar={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 1.5,
              flexShrink: 0,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <ArticleOutlinedIcon sx={{ color: "primary.main" }} />
          </Box>
        }
        title={WIZARD.report.title}
        slotProps={{
          title: {
            variant: "subtitle2",
            fontWeight: 600,
            component: "h3",
            color: "text.primary",
          },
        }}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <MuiEmptyState
          title={WIZARD.report.generateEmptyTitle}
          description={WIZARD.report.generateEmptyDescription}
          minHeight="200px"
        />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <MuiButton
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={onGenerate}
            disabled={generating}
            loading={generating}
            sx={{ alignSelf: "flex-start" }}
          >
            {generating ? WIZARD.report.generating : WIZARD.report.generate}
          </MuiButton>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ maxWidth: 480 }}
          >
            {WIZARD.report.generateHint}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}