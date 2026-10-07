import Box from "@mui/material/Box";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { Seo } from "@/components/site/Seo";
import { CategorySelection } from "@/components/site/home/CategorySelection";

export default function ListingPage() {
  return <>
    <Seo title="All Categories" description="Browse all VnU product categories." canonicalPath="/categories" />
    <ToyNestHeader />
    <Box component="main" sx={{ minHeight: "55vh" }}>
      <CategorySelection fullPage />
    </Box>
    <ToyNestFooter />
  </>;
}
