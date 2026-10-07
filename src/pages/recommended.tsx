import Box from "@mui/material/Box";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { Seo } from "@/components/site/Seo";
import { FeaturedProducts } from "@/components/site/home/FeaturedProducts";

export default function ListingPage() {
  return <>
    <Seo title="Recommended for You" description="Browse all recommended products at VnU." canonicalPath="/recommended" />
    <ToyNestHeader />
    <Box component="main" sx={{ minHeight: "55vh" }}>
      <FeaturedProducts filter="isRecommended" title="Recommended for You" fullPage />
    </Box>
    <ToyNestFooter />
  </>;
}
