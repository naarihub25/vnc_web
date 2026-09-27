import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { blue, ink } from "./toyNestTokens";

export function SectionHeader({
  title,
  actionLabel = "View All",
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", mb: 2.5 }}
    >
      <Typography
        component="h2"
        sx={{ color: ink, fontSize: { xs: 24, md: 28 }, fontWeight: 800 }}
      >
        {title}
      </Typography>
      <Button
        endIcon={<ArrowForwardIcon />}
        href="#"
        sx={{ color: blue, fontSize: 14, minWidth: "auto" }}
      >
        {actionLabel}
      </Button>
    </Stack>
  );
}
