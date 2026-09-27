import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { categoryHref, parentId, useStoreCategories } from "@/hooks/useStoreCategories";
import { StoreHeader } from "./StoreHeader";
import { AppFooter } from "./AppFooter";
import { ToyNestHeader, ToyNestFooter } from "./home/ToyNestHome";
import { ProductCard } from "./home/ProductCard";
import type { ProductCardData } from "./home/types";
import { Seo } from "./Seo";

type Product = {
  _id: string; slug: string; category: string | { _id: string }; name: string; description: string; productType: string;
  images: { url: string; alt: string }[]; currency: string; retailPrice?: number; wholesalePrice?: number;
  minWholesaleQty?: number; isActive: boolean; isRetail: boolean; isWholesale: boolean;
};
export function CategoryProductsPage({ wholesale = false }: { wholesale?: boolean }) {
  const router = useRouter();
  const { categories, loading: categoriesLoading, error: categoriesError, retry: retryCategories } = useStoreCategories();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const category = categories.find((item) => item.slug === slug);
  const parent = category ? categories.find((item) => item._id === parentId(category)) : undefined;
  // A root selection includes its subcategories, whose products have their own category IDs.
  const ids = new Set<string>(category ? [category._id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of categories) {
      if (ids.has(parentId(item) ?? "") && !ids.has(item._id)) { ids.add(item._id); changed = true; }
    }
  }
  const categoryIds = JSON.stringify([...ids].sort());
  const requestKey = `${wholesale}:${slug}:${categoryIds}`;
  const [result, setResult] = useState<{ key: string; products: ProductCardData[]; error: string }>({ key: "", products: [], error: "" });
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const selectedIds: string[] = JSON.parse(categoryIds);
    if (!selectedIds.length) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const records = new Map<string, Product>();
        for (const id of selectedIds) {
          let page = 1;
          const seen = new Set<string>();
          while (!controller.signal.aborted) {
            const query = new URLSearchParams({ category: id, isActive: "true", [wholesale ? "isWholesale" : "isRetail"]: "true", page: String(page), limit: "100" });
            const response = await fetch(`${base}/api/products?${query}`, { signal: controller.signal, cache: "no-store" });
            const data = await response.json();
            if (!response.ok || !Array.isArray(data?.products) || typeof data.total !== "number") throw new Error("Unable to load products.");
            const previous = seen.size;
            for (const product of data.products as Product[]) {
              seen.add(product._id);
              const productCategory = typeof product.category === "string" ? product.category : product.category?._id;
              if (selectedIds.includes(productCategory) && product.isActive && (wholesale ? product.isWholesale : product.isRetail)) records.set(product._id, product);
            }
            if (seen.size >= data.total) break;
            if (seen.size === previous) throw new Error("Unable to load all products.");
            page += 1;
          }
        }
        const products = [...records.values()].map((product): ProductCardData => {
          const amount = wholesale ? product.wholesalePrice : product.retailPrice;
          let price = typeof amount === "number" ? `${product.currency} ${amount.toFixed(2)}` : "Price unavailable";
          if (typeof amount === "number") {
            try { price = new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency }).format(amount); } catch { /* Keep the supplied currency code. */ }
          }
          const description = product.description || product.productType;
          return { id: product._id, slug: product.slug, href: `${wholesale ? "/wholesale" : ""}/products/${encodeURIComponent(product.slug)}`, title: product.name, description: wholesale && product.minWholesaleQty ? `${description} · Minimum ${product.minWholesaleQty} units` : description,
            images: product.images, icon: "🛍️", imageColor: "#edf4ef", price, originalPrice: "", discount: "" };
        });
        if (!controller.signal.aborted) setResult({ key: requestKey, products, error: "" });
      } catch {
        if (!controller.signal.aborted) setResult({ key: requestKey, products: [], error: "Unable to load products. Please try again." });
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [categoryIds, requestKey, wholesale, refresh]);
  const busy = !router.isReady || categoriesLoading || (Boolean(category) && (loading || result.key !== requestKey));
  return <>
    <Seo
      title={category ? `${category.name}${wholesale ? " Wholesale" : ""}` : "Product Category"}
      description={category?.description || `Shop ${category?.name ?? "category"} products${wholesale ? " at wholesale prices" : ""} from VnU.`}
      canonicalPath={`${wholesale ? "/wholesale" : ""}/categories/${encodeURIComponent(slug)}`}
      image={category?.imageUrl || undefined}
      imageAlt={category?.name || "VnU product category"}
      noIndex={!category && !categoriesLoading}
      structuredData={category ? { "@context": "https://schema.org", "@type": "CollectionPage", name: category.name, description: category.description || `Shop ${category.name} products from VnU.` } : undefined}
    />
    {wholesale ? <StoreHeader variant="wholesale" /> : <ToyNestHeader />}
    <Box component="main" sx={{ minHeight: "55vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={wholesale ? "/wholesale" : "/"}>Home</Link>
          {parent ? <Link href={categoryHref(parent, wholesale)}>{parent.name}</Link> : null}
          <Typography color="text.primary">{category?.name ?? "Category"}</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>{category?.name ?? "Category products"}</Typography>
        {categoriesError ? <Alert severity="error" action={<Button color="inherit" onClick={() => void retryCategories()}>Retry</Button>}>{categoriesError}</Alert> :
          busy ? <Typography role="status">Loading products...</Typography> :
          !category ? <Alert severity="info">This category is unavailable. <Link href={wholesale ? "/wholesale" : "/"}>Continue shopping</Link></Alert> :
          result.error ? <Alert severity="error" action={<Button color="inherit" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>}>{result.error}</Alert> : <>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{result.products.length} {result.products.length === 1 ? "product" : "products"}</Typography>
            {!result.products.length ? <Typography>No products available in this category yet.</Typography> : <Grid container spacing={3}>
              {result.products.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 3 }}><ProductCard product={product} /></Grid>)}
            </Grid>}
          </>}
      </Container>
    </Box>
    {wholesale ? <AppFooter /> : <ToyNestFooter />}
  </>;
}
