import Box from "@mui/material/Box";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { Seo } from "@/components/site/Seo";
import { FeaturedProducts } from "@/components/site/home/FeaturedProducts";

export default function ListingPage() {
  return <>
    <Seo title="Trending Now" description="Browse all trending products at VnU." canonicalPath="/trending" />
    <ToyNestHeader />
    <Box component="main" sx={{ minHeight: "55vh" }}>
      <FeaturedProducts filter="isTrending" title="Trending Now" fullPage />
    </Box>
    <ToyNestFooter />
  </>;
}
