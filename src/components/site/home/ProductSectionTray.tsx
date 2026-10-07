import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";
import type { ProductSectionData } from "./types";

export function ProductSectionTray({
  section,
  actionHref,
  fullPage = false,
}: {
  section: ProductSectionData;
  actionHref?: string;
  fullPage?: boolean;
}) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <SectionHeader title={section.title} actionHref={actionHref} headingComponent={fullPage ? "h1" : "h2"} />
      <Grid container spacing={3}>
        {section.products.map((product) => (
          <Grid key={product.id ?? product.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
