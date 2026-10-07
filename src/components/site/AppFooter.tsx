import { BrandLogo } from "@/components/common/BrandLogo";
import { categoryHref, useStoreCategories } from "@/hooks/useStoreCategories";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type AppFooterProps = {
  enquiryEmail?: string;
  trackingUrl?: string;
  wholesale?: boolean;
};

export function AppFooter({
  enquiryEmail = process.env.NEXT_PUBLIC_ENQUIRY_EMAIL ?? "",
  trackingUrl = "/track-order",
  wholesale = false,
}: AppFooterProps) {
  const { roots } = useStoreCategories();
  return <Box component="footer" sx={{ bgcolor: "#073b3f", color: "common.white", mt: { xs: 4, md: 6 }, py: 4 }}>
    <Container maxWidth="xl">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}>
        <BrandLogo size={96} />
        {roots.length ? <Box component="nav" aria-label="Footer categories" sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Categories</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1 }}>
            {roots.map((category) => <Link key={category._id} component={NextLink}
              href={categoryHref(category, wholesale)} color="inherit" underline="hover" sx={{ overflowWrap: "anywhere" }}>
              {category.name}
            </Link>)}
          </Box>
        </Box> : null}
        <Stack spacing={0.5}>
          <Typography variant="body2">Enquiries</Typography>
          {enquiryEmail ? <Link href={`mailto:${enquiryEmail}`} color="inherit" underline="hover" sx={{ overflowWrap: "anywhere" }}>{enquiryEmail}</Link> : null}
        </Stack>
        {trackingUrl ? <Link href={trackingUrl} color="inherit" underline="hover">Track My Order</Link> :
          <Typography color="inherit" aria-disabled="true">Track My Order</Typography>}
      </Stack>
    </Container>
  </Box>;
}
