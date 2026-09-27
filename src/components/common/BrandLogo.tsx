import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export function BrandLogo({ href = "/", size = 72, label }: { href?: string; size?: number; label?: string }) {
  return <Stack component={Link} href={href} direction="row" spacing={1} aria-label={`VnU — Vibrant n Unique${label ? ` ${label}` : ""}`} sx={{ alignItems: "center", flexShrink: 0, width: "fit-content" }}>
    <Box component="img" src="/brand/vnu-logo.jpeg" alt="VnU — Vibrant n Unique" width={size} height={size}
      sx={{ display: "block", width: size, height: size, objectFit: "contain", bgcolor: "common.white", borderRadius: 2 }} />
    {label ? <Typography variant="caption" sx={{ fontWeight: 700, color: "inherit" }}>{label}</Typography> : null}
  </Stack>;
}
