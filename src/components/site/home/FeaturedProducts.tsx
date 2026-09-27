import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { ProductSectionTray } from "./ProductSectionTray";
import { SectionHeader } from "./SectionHeader";
import type { ProductCardData } from "./types";

type Product = {
  _id: string; slug: string; name: string; description: string; productType: string;
  images: { url: string; alt: string }[]; currency: string; retailPrice: number;
  isActive: boolean; isRetail: boolean; isTrending: boolean; isRecommended: boolean;
};
export function FeaturedProducts({ filter, title }: {
  filter: "isTrending" | "isRecommended";
  title: string;
}) {
  const label = filter === "isTrending" ? "trending" : "recommended";
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const records = new Map<string, Product>();
        let page = 1;
        while (!controller.signal.aborted) {
          const response = await fetch(`${base}/api/products?${filter}=true&isRetail=true&isActive=true&page=${page}&limit=20`, {
            signal: controller.signal, cache: "no-store",
          });
          const result = await response.json();
          if (!response.ok || !Array.isArray(result?.products) || typeof result.total !== "number") throw new Error(`Unable to load ${label} products.`);
          const previous = records.size;
          result.products.forEach((product: Product) => records.set(product._id, product));
          if (records.size >= result.total) break;
          if (previous === records.size) throw new Error(`Unable to load ${label} products.`);
          page += 1;
        }
        if (!controller.signal.aborted) setProducts([...records.values()]
          .filter((product) => product[filter] && product.isActive && product.isRetail)
          .map((product) => {
            let price = `${product.currency} ${product.retailPrice.toFixed(2)}`;
            try { price = new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency }).format(product.retailPrice); } catch { /* Use the supplied currency code as a fallback. */ }
            return { id: product._id, slug: product.slug, title: product.name, description: product.description || product.productType,
              images: product.images, icon: "🛍️", imageColor: "#edf4ef", price, originalPrice: "", discount: "" };
          }));
      } catch {
        if (!controller.signal.aborted) setError(`Unable to load ${label} products. Please try again.`);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [retry, filter, label]);
  if (loading || error || !products.length) return <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
    <SectionHeader title={title} />
    {loading ? <Typography role="status">Loading {label} products...</Typography> : error ?
      <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry((value) => value + 1)}>Retry</Button>}>{error}</Alert> :
      <Typography color="text.secondary">No {label} products available right now.</Typography>}
  </Container>;
  return <ProductSectionTray section={{ title, products }} />;
}
