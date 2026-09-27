import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Banner = {
  _id: string; title: string; images: { url: string; alt: string }[];
  redirectUrl: string; position: "carousal" | "offerBanner"; isActive: boolean; sortOrder: number;
};
const BannerContext = createContext<{ banners: Banner[]; loading: boolean; error: string; retry: () => void }>({ banners: [], loading: true, error: "", retry: () => {} });
export function HomeBannersProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const records = new Map<string, Banner>();
        let page = 1;
        while (!controller.signal.aborted) {
          const response = await fetch(`${base}/api/banners?isActive=true&page=${page}&limit=100`, { signal: controller.signal, cache: "no-store" });
          const result = await response.json();
          if (!response.ok || !Array.isArray(result?.banners) || typeof result.total !== "number") throw new Error("Invalid banner response");
          const previous = records.size;
          result.banners.forEach((banner: Banner) => records.set(banner._id, banner));
          if (records.size >= result.total) break;
          if (previous === records.size) throw new Error("Incomplete banner response");
          page += 1;
        }
        if (!controller.signal.aborted) setBanners([...records.values()].filter((banner) => banner.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder || a._id.localeCompare(b._id)));
      } catch {
        if (!controller.signal.aborted) setError("Unable to load banners. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [refresh]);
  return <BannerContext.Provider value={{ banners, loading, error, retry: () => setRefresh((value) => value + 1) }}>{children}</BannerContext.Provider>;
}
function safeDestination(value: string) {
  if (/\s|\\/.test(value)) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { if (["http:", "https:"].includes(new URL(value).protocol)) return value; } catch { /* Invalid destination is not linked. */ }
  return undefined;
}
function validImage(value: string) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
export function HomeBannerSection({ position }: { position: Banner["position"] }) {
  const { banners, loading, error, retry } = useContext(BannerContext);
  const [index, setIndex] = useState(0);
  const slides = banners.filter((banner) => banner.position === position)
    .flatMap((banner) => banner.images.filter((image) => validImage(image.url)).map((image, imageIndex) => ({ banner, image, key: `${banner._id}-${imageIndex}` })));
  const active = slides.length ? index % slides.length : 0;
  const isHero = position === "carousal";
  if (loading) return <Container maxWidth="xl" sx={{ py: 3 }}><Skeleton aria-label="Loading banners" variant="rounded" height={isHero ? 350 : 160} /></Container>;
  if (error) return isHero ? <Container maxWidth="xl" sx={{ py: 3 }}><Alert severity="error" action={<Button color="inherit" onClick={retry}>Retry</Button>}>{error}</Alert></Container> : null;
  if (!slides.length) return null;
  const renderSlide = (slide: typeof slides[number]) => <Box component="a" href={safeDestination(slide.banner.redirectUrl)}
    aria-label={slide.banner.title} sx={{ display: "block", color: "inherit", textDecoration: "none", borderRadius: 3, overflow: "hidden", bgcolor: "#edf4ef" }}>
    <Box component="img" src={slide.image.url} alt={slide.image.alt || slide.banner.title}
      loading={isHero ? "eager" : "lazy"} sx={{ display: "block", width: "100%", height: "auto", maxHeight: isHero ? 520 : 320, objectFit: "contain" }} />
    <Typography component={isHero ? "h1" : "h2"} sx={{ px: { xs: 2, md: 4 }, py: 2, fontWeight: 800, fontSize: { xs: 20, md: 28 } }}>{slide.banner.title}</Typography>
  </Box>;
  return <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
    {isHero ? <Box role="region" aria-roledescription="carousel" aria-label="Featured banners">
      <Box aria-live="polite" aria-atomic="true">{renderSlide(slides[active])}</Box>
      {slides.length > 1 ? <Stack direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "center", mt: 1 }}>
        <IconButton aria-label="Previous banner" onClick={() => setIndex((active - 1 + slides.length) % slides.length)}><ChevronLeftIcon /></IconButton>
        <Typography variant="body2">{active + 1} / {slides.length}</Typography>
        <IconButton aria-label="Next banner" onClick={() => setIndex((active + 1) % slides.length)}><ChevronRightIcon /></IconButton>
      </Stack> : null}
    </Box> : <Stack spacing={2}>{slides.map((slide) => <Box key={slide.key}>{renderSlide(slide)}</Box>)}</Stack>}
  </Container>;
}
