import { GuestCheckoutDialog } from "./GuestCheckoutDialog";
import { addToCart } from "@/hooks/useCart";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { categoryHref, useStoreCategories } from "@/hooks/useStoreCategories";
import { AppFooter } from "./AppFooter";
import { StoreHeader } from "./StoreHeader";
import { ToyNestHeader, ToyNestFooter } from "./home/ToyNestHome";
import { ProductCard } from "./home/ProductCard";
import { Seo } from "./Seo";

type Product = {
  _id: string; slug: string; name: string; sku: string; category: string | { _id: string }; productType: string;
  description: string; images: { url: string; alt: string }[]; currency: string;
  isRetail: boolean; retailPrice?: number; isWholesale: boolean; wholesalePrice?: number;
  minWholesaleQty?: number; stockQuantity: number; isActive: boolean; isTrending: boolean; isRecommended: boolean;
};
const categoryId = (product: Product) => typeof product.category === "string" ? product.category : product.category._id;
function price(product: Product, wholesale: boolean) {
  const amount = wholesale ? product.wholesalePrice : product.retailPrice;
  if (typeof amount !== "number") return "Price unavailable";
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: product.currency }).format(amount); }
  catch { return `${product.currency} ${amount.toFixed(2)}`; }
}
export function ProductDetailsPage({ wholesale = false }: { wholesale?: boolean }) {
  const router = useRouter();
  const identifier = typeof router.query.id === "string" ? router.query.id : "";
  return <>
    {wholesale ? <StoreHeader variant="wholesale" /> : <ToyNestHeader />}
    {identifier ? <ProductDetails key={`${wholesale}:${identifier}`} identifier={identifier} wholesale={wholesale} /> : <Container sx={{ py: 6 }}>Loading product...</Container>}
    {wholesale ? <AppFooter /> : <ToyNestFooter />}
  </>;
}
function ProductDetails({ identifier, wholesale }: { identifier: string; wholesale: boolean }) {
  const { categories } = useStoreCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [tab, setTab] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        // Use the existing list contract until a dedicated detail endpoint is supplied.
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const records = new Map<string, Product>();
        let page = 1;
        while (!controller.signal.aborted) {
          const response = await fetch(`${base}/api/products?isActive=true&${wholesale ? "isWholesale" : "isRetail"}=true&page=${page}&limit=100`, { signal: controller.signal, cache: "no-store" });
          const data = await response.json();
          if (!response.ok || !Array.isArray(data?.products) || typeof data.total !== "number") throw new Error("Invalid products response");
          const previous = records.size;
          data.products.forEach((product: Product) => records.set(product._id, product));
          if (records.size >= data.total) break;
          if (records.size === previous) throw new Error("Incomplete products response");
          page += 1;
        }
        if (!controller.signal.aborted) setProducts([...records.values()].filter((product) => product.isActive && (wholesale ? product.isWholesale : product.isRetail)));
      } catch { if (!controller.signal.aborted) setError("Unable to load this product. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [wholesale, retry]);
  const product = products.find((item) => item.slug === identifier || item._id === identifier);
  const home = wholesale ? "/wholesale" : "/";
  if (loading || error || !product) return <Container component="main" maxWidth="xl" sx={{ py: 6, minHeight: "50vh" }}>
    <Seo title="Product" description="View product details, availability and pricing at VnU." />
    {loading ? <Typography role="status">Loading product...</Typography> : error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry((value) => value + 1)}>Retry</Button>}>{error}</Alert> : <Alert severity="info">This product is unavailable. <Link href={home}>Continue shopping</Link></Alert>}
  </Container>;
  const category = categories.find((item) => item._id === categoryId(product));
  const image = product.images[selected] ?? product.images[0];
  const minimum = wholesale ? product.minWholesaleQty ?? 1 : 1;
  const qty = quantity ?? minimum;
  const available = product.stockQuantity >= minimum;
  const purchaseDisabled = !available || typeof (wholesale ? product.wholesalePrice : product.retailPrice) !== "number";
  const addProduct = (buyNow = false) => {
    try {
      addToCart({ id: product._id, slug: product.slug, name: product.name, image: product.images[0]?.url ?? "",
        price: (wholesale ? product.wholesalePrice : product.retailPrice)!, currency: product.currency,
        wholesale, quantity: qty, minimum, stock: product.stockQuantity });
      setCartError("");
      setCartMessage(buyNow ? "" : `${qty} item(s) added to your cart.`);
      if (buyNow) setCheckoutOpen(true);
    } catch (cause) {
      setCartMessage("");
      setCartError(cause instanceof Error ? cause.message : "Unable to add to cart.");
    }
  };
  const related = products.filter((item) => item._id !== product._id && categoryId(item) === categoryId(product)).slice(0, 4);
  return <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
    <Seo
      title={product.name}
      description={product.description || `Shop ${product.name} from VnU.`}
      canonicalPath={`${wholesale ? "/wholesale" : ""}/products/${encodeURIComponent(product.slug)}`}
      image={product.images[0]?.url}
      imageAlt={product.images[0]?.alt || product.name}
      type="product"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || product.productType,
        image: product.images.map((item) => item.url),
        sku: product.sku,
        category: category?.name || product.productType,
        offers: {
          "@type": "Offer",
          priceCurrency: product.currency,
          price: wholesale ? product.wholesalePrice : product.retailPrice,
          availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }}
    />
    <Breadcrumbs sx={{ mb: 3 }}><Link href={home}>Home</Link>{category ? <Link href={categoryHref(category, wholesale)}>{category.name}</Link> : null}<Typography color="text.primary">{product.name}</Typography></Breadcrumbs>
    <Grid container spacing={{ xs: 3, md: 5 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
          <Stack direction={{ xs: "row", sm: "column" }} spacing={1.5} sx={{ overflowX: "auto", maxWidth: "100%", flexShrink: 0 }}>
            {product.images.map((item, index) => <Box component="button" type="button" key={`${item.url}-${index}`} onClick={() => setSelected(index)}
              aria-label={`View image ${index + 1}`} aria-pressed={index === selected}
              sx={{ p: 0.5, border: 2, borderColor: index === selected ? "primary.main" : "divider", bgcolor: "background.paper", borderRadius: 2, cursor: "pointer" }}>
              <Box component="img" src={item.url} alt={item.alt || ""} sx={{ display: "block", width: 64, height: 72, objectFit: "contain" }} />
            </Box>)}
          </Stack>
          <Box sx={{ width: "100%", position: "relative", bgcolor: "#edf4ef", borderRadius: 3, overflow: "hidden" }}>
            {image ? <Box component="img" src={image.url} alt={image.alt || product.name} sx={{ display: "block", width: "100%", height: { xs: 360, md: 540 }, objectFit: "contain" }} /> : <Typography sx={{ p: 6 }}>No image available</Typography>}
            {image ? <IconButton aria-label="Enlarge product image" onClick={() => setZoom(true)} sx={{ position: "absolute", right: 12, top: 12, bgcolor: "background.paper" }}><ZoomInIcon /></IconButton> : null}
          </Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={2.5}>
          <Typography color="primary" variant="overline">VnU · {product.productType}</Typography>
          <Typography component="h1" variant="h4">{product.name}</Typography>
          <Typography color="text.secondary">{product.description || product.productType}</Typography>
          <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
          <Stack direction="row" spacing={1}>{product.isTrending ? <Chip label="Trending" size="small" color="secondary" /> : null}{product.isRecommended ? <Chip label="Recommended" size="small" color="primary" /> : null}</Stack>
          <Typography variant="h4" color="secondary" sx={{ fontWeight: 800 }}>{price(product, wholesale)}</Typography>
          <Typography color="text.secondary" variant="body2">{wholesale ? `Wholesale price per unit · Minimum ${minimum} units` : "Retail price per unit"}</Typography>
          <Typography color={available ? "success.main" : "error.main"}>{available ? `In stock · ${product.stockQuantity} available` : "Currently unavailable"}</Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography>Quantity</Typography>
            <Paper variant="outlined" sx={{ display: "flex", alignItems: "center" }}>
              <IconButton aria-label="Decrease quantity" disabled={!available || qty <= minimum} onClick={() => setQuantity(qty - 1)}><RemoveIcon /></IconButton>
              <Typography aria-live="polite" sx={{ px: 2 }}>{qty}</Typography>
              <IconButton aria-label="Increase quantity" disabled={!available || qty >= product.stockQuantity} onClick={() => setQuantity(qty + 1)}><AddIcon /></IconButton>
            </Paper>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button disabled={purchaseDisabled} variant="contained" size="large" fullWidth onClick={() => addProduct()}>Add to Cart</Button>
            <Button disabled={purchaseDisabled} variant="outlined" size="large" fullWidth onClick={() => addProduct(true)}>Buy Now</Button>
          </Stack>
          {cartMessage ? <Alert severity="success" action={<Button component={Link} href="/cart" color="inherit">View cart</Button>}>{cartMessage}</Alert> : null}
          {cartError ? <Alert severity="error">{cartError}</Alert> : null}
          <Typography variant="caption" color="text.secondary">Your cart expires 5 minutes after your last cart change.</Typography>
          {!wholesale && product.isWholesale ? <Paper variant="outlined" sx={{ p: 2, bgcolor: "primary.light" }}><Typography sx={{ fontWeight: 700 }}>Buying in bulk?</Typography><Button component={Link} href={`/wholesale/products/${encodeURIComponent(product.slug)}`}>View wholesale pricing</Button></Paper> : null}
          {wholesale && product.isRetail ? <Button component={Link} href={`/products/${encodeURIComponent(product.slug)}`}>Shop this product at retail price</Button> : null}
        </Stack>
      </Grid>
    </Grid>
    <Box sx={{ mt: 6 }}>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="Product information"><Tab id="description-tab" aria-controls="description-panel" label="Description" /><Tab id="details-tab" aria-controls="details-panel" label="Product Details" /></Tabs>
      <Paper role="tabpanel" id={tab === 0 ? "description-panel" : "details-panel"} aria-labelledby={tab === 0 ? "description-tab" : "details-tab"} variant="outlined" sx={{ p: { xs: 2, md: 4 }, mt: 1 }}>
        {tab === 0 ? <><Typography variant="h6" sx={{ mb: 2 }}>{product.name}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{product.description || "No additional description available."}</Typography></> : <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 2 }}>
          {[["SKU", product.sku], ["Product type", product.productType], ["Category", category?.name ?? "—"], ["Currency", product.currency], ["Stock", String(product.stockQuantity)], ["Minimum quantity", String(minimum)]].map(([label, value]) => <Box key={label} sx={{ display: "contents" }}><Typography component="dt" color="text.secondary">{label}</Typography><Typography component="dd">{value}</Typography></Box>)}
        </Box>}
      </Paper>
    </Box>
    {related.length ? <Box sx={{ mt: 5 }}><Typography variant="h5" sx={{ mb: 3 }}>You may also like</Typography><Grid container spacing={3}>{related.map((item) => <Grid key={item._id} size={{ xs: 12, sm: 6, md: 3 }}><ProductCard product={{ id: item._id, slug: item.slug, href: `${wholesale ? "/wholesale" : ""}/products/${encodeURIComponent(item.slug)}`, title: item.name, description: item.description || item.productType, images: item.images, icon: "🛍️", imageColor: "#edf4ef", price: price(item, wholesale), originalPrice: "", discount: "" }} /></Grid>)}</Grid></Box> : null}
    {checkoutOpen ? <GuestCheckoutDialog open onClose={() => setCheckoutOpen(false)} /> : null}
    <Dialog open={zoom} onClose={() => setZoom(false)} maxWidth="lg" fullWidth><DialogTitle>{product.name}<Button onClick={() => setZoom(false)} sx={{ float: "right" }}>Close</Button></DialogTitle><DialogContent>{image ? <Box component="img" src={image.url} alt={image.alt || product.name} sx={{ width: "100%", maxHeight: "75vh", objectFit: "contain" }} /> : null}</DialogContent></Dialog>
  </Container>;
}
