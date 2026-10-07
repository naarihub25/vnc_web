import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { CategoryCard } from "./CategoryCard";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { categoryHref, useStoreCategories } from "@/hooks/useStoreCategories";
import { SectionHeader } from "./SectionHeader";
import type { CategoryCardData } from "./types";

export function CategorySelection({
  items,
  fullPage = false,
}: {
  items?: CategoryCardData[];
  fullPage?: boolean;
}) {
  const { categories, roots, loading, error, retry } = useStoreCategories();
  const listing = fullPage ? categories : roots;
  const displayItems = items ?? listing.map((category) => ({
    title: category.name, icon: "🛍️", color: "#edf4ef", imageUrl: category.imageUrl,
    href: categoryHref(category),
  }));
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
      <SectionHeader title={fullPage ? "All Categories" : "Shop by Category"} actionHref={fullPage ? undefined : "/categories"} headingComponent={fullPage ? "h1" : "h2"} />
      {!items && loading ? <Typography role="status">Loading categories...</Typography> : null}
      {!items && error ? <Alert severity="error" action={<Button color="inherit" onClick={() => void retry()}>Retry</Button>}>{error}</Alert> : null}
      {!items && !loading && !error && !listing.length ? <Typography>No categories available yet.</Typography> : null}
      <Grid container spacing={2}>
        {displayItems.map((category) => (
          <Grid key={category.href ?? category.title} size={{ xs: 6, sm: 4, md: 3, lg: 1.5 }}>
            <CategoryCard category={category} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
