import { BrandLogo } from "@/components/common/BrandLogo";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type FooterLinkGroup = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

export type AppFooterProps = {
  logoText?: string;
  description?: string;
  groups?: FooterLinkGroup[];
};

const defaultGroups: FooterLinkGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "Kids Collection", href: "#" },
      { label: "Gifting Items", href: "#" },
      { label: "Wholesale", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "#" },
      { label: "Shipping", href: "#" },
      { label: "Returns", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function AppFooter({
  description = "Retail and wholesale products across kids, gifting, home and lifestyle categories.",
  groups = defaultGroups,
}: AppFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#073b3f",
        color: "common.white",
        mt: 8,
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <BrandLogo size={128} />
            <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 360 }}>
              {description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <IconButton aria-label="Instagram" color="inherit">
                <InstagramIcon />
              </IconButton>
              <IconButton aria-label="Facebook" color="inherit">
                <FacebookIcon />
              </IconButton>
              <IconButton aria-label="LinkedIn" color="inherit">
                <LinkedInIcon />
              </IconButton>
            </Stack>
          </Grid>
          {groups.map((group) => (
            <Grid key={group.title} size={{ xs: 12, sm: 4, md: 2.6 }}>
              <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle1">
                {group.title}
              </Typography>
              <Stack spacing={1}>
                {group.links.map((link) => (
                  <Link
                    color="inherit"
                    href={link.href}
                    key={link.label}
                    sx={{ color: "rgba(255,255,255,0.72)" }}
                    underline="hover"
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Typography
          sx={{
            borderColor: "rgba(255,255,255,0.14)",
            borderTop: 1,
            color: "rgba(255,255,255,0.64)",
            mt: 4,
            pt: 3,
          }}
          variant="body2"
        >
          Copyright {new Date().getFullYear()} VnU — Vibrant n Unique. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
