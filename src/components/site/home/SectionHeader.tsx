import Link from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { blue, ink } from "./toyNestTokens";

export function SectionHeader({
  title,
  actionLabel = "View All",
  actionHref,
  headingComponent = "h2",
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  headingComponent?: "h1" | "h2";
}) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", mb: 2.5 }}
    >
      <Typography
        component={headingComponent}
        sx={{ color: ink, fontSize: { xs: 24, md: 28 }, fontWeight: 800 }}
      >
        {title}
      </Typography>
      {actionHref ? <Button
        component={Link}
        endIcon={<ArrowForwardIcon />}
        href={actionHref}
        sx={{ color: blue, fontSize: 14, minWidth: "auto" }}
      >
        {actionLabel}
      </Button> : null}
    </Stack>
  );
}
