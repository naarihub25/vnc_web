import { StoreSearch } from "../StoreSearch";
import Badge from "@mui/material/Badge";
import { useCart } from "@/hooks/useCart";
import { BrandLogo } from "@/components/common/BrandLogo";
import { HomeBannersProvider, HomeBannerSection } from "./HomeBanners";
import { useState } from "react";
import { CategoryNavigation } from "../CategoryNavigation";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CategorySelection } from "./CategorySelection";
import {
  trustCards,
} from "./data";
import { TrendingProducts } from "./TrendingProducts";
import { FeaturedProducts } from "./FeaturedProducts";
import {
  ink,
  muted,
  sky,
} from "./toyNestTokens";
import type { TrustCardData } from "./types";

export function ToyNestHeader() {
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <Box component="header" sx={{ bgcolor: "common.white" }}>
      <Stack
        direction="row"
        spacing={{ xs: 2, sm: 8 }}
        sx={{
          alignItems: "center",
          bgcolor: sky,
          color: ink,
          justifyContent: "center",
          minHeight: 34,
          px: 2,
          textAlign: "center",
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            Free delivery on orders above ₹999
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", display: { xs: "none", sm: "flex" } }}
        >
          <AutorenewIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">Easy 7-day returns</Typography>
        </Stack>
      </Stack>

      <Container maxWidth="xl">
        <Stack
          direction="row"
          spacing={0}
          sx={{ alignItems: "center", minHeight: { xs: 72, md: 84 }, py: 1 }}
        >
          <BrandLogo size={64} />
          <IconButton onClick={() => setMobileOpen(true)} aria-label="Open menu" sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <CategoryNavigation mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
          <Box sx={{ display: { xs: "none", lg: "block" }, flex: "0 1 360px", minWidth: 240, maxWidth: 420, ml: 2 }}>
            <StoreSearch />
          </Box>
          <IconButton aria-label={`Cart, ${count} items`} href="/cart" sx={{ flexShrink: 0, ml: { xs: "auto", md: 2 } }}>
            <Badge badgeContent={count} color="secondary"><ShoppingCartOutlinedIcon /></Badge>
          </IconButton>
        </Stack>

        <Box sx={{ display: { xs: "block", lg: "none" }, pb: 2, maxWidth: { md: 680 }, mx: "auto" }}>
          <StoreSearch />
        </Box>
      </Container>
    </Box>
  );
}

export function HeroCarousel() {
  return <HomeBannerSection position="carousal" />;
}

export function PromoBanner() {
  return <HomeBannerSection position="offerBanner" />;
}

export function TrustStrip({ items = trustCards }: { items?: TrustCardData[] }) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Grid container spacing={2.5}>
        {items.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                bgcolor: item.color,
                borderRadius: 3,
                minHeight: 112,
                px: 2.75,
              }}
            >
              <Box sx={{ color: ink, display: "flex", fontSize: 34 }}>
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ color: ink, fontSize: 14, fontWeight: 800 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: muted, fontSize: 11, mt: 0.75 }}>
                  {item.detail}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export function ToyNestFooter() {
  const groups = [
    {
      title: "Shop",
      links: [
        "All Toys",
        "Soft Toys",
        "Educational Toys",
        "Arts & Crafts",
        "Building Blocks",
        "Outdoor Play",
        "Gift Hampers",
        "Offers",
      ],
    },
    {
      title: "Help",
      links: [
        "Track Order",
        "Returns & Refunds",
        "Shipping Info",
        "FAQs",
        "Size Guide",
        "Contact Us",
      ],
    },
    {
      title: "About Us",
      links: ["Our Story", "Careers", "Blog", "Press", "Sustainability"],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#073b3f",
        color: "common.white",
        mt: { xs: 4, md: 6 },
        pb: { xs: 5, md: 8 },
        pt: { xs: 5, md: 8 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <BrandLogo size={128} />
            <Typography
              sx={{ color: "#d4dfd0", fontSize: 14, maxWidth: 300, mt: 2 }}
            >
              Bringing joy, learning and imagination to kids with the best toys
              & gifts.
            </Typography>
          </Grid>

          {groups.map((group) => (
            <Grid key={group.title} size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 800, mb: 2.5 }}>
                {group.title}
              </Typography>
              <Stack spacing={1.5}>
                {group.links.map((link) => (
                  <Link
                    color="inherit"
                    href="#"
                    key={link}
                    sx={{ color: "#d4dfd0", fontSize: 13 }}
                    underline="hover"
                  >
                    {link}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          <Grid size={{ xs: 12, md: 3 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 800, mb: 2.5 }}>
              Contact
            </Typography>
            <Stack spacing={1.5} sx={{ color: "#d4dfd0", fontSize: 13 }}>
              <Box>+91 80 1234 5678</Box>
              <Box>hello@toynest.com</Box>
              <Box>Bangalore, Karnataka</Box>
            </Stack>

            <Typography sx={{ fontSize: 17, fontWeight: 800, mt: 5 }}>
              Newsletter
            </Typography>
            <Typography sx={{ color: "#d4dfd0", fontSize: 12, mt: 1.5 }}>
              Subscribe for updates & offers
            </Typography>
            <Box
              component="form"
              sx={{
                alignItems: "center",
                bgcolor: "common.white",
                borderRadius: 1.75,
                display: "flex",
                mt: 2,
                overflow: "hidden",
              }}
            >
              <InputBase
                aria-label="Email address"
                placeholder="Enter your email"
                sx={{ color: muted, flex: 1, fontSize: 12, px: 1.75 }}
              />
              <Button sx={{ borderRadius: 0, minHeight: 44 }} variant="contained">
                Subscribe
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            color: "#bbcbb9",
            fontSize: 12,
            justifyContent: "space-between",
            mt: { xs: 8, md: 16 },
          }}
        >
          <Box>© 2026 VnU — Vibrant n Unique. All rights reserved.</Box>
          <Box>We accept VISA Mastercard UPI Paytm</Box>
        </Stack>
      </Container>
    </Box>
  );
}

export function ToyNestHome() {
  return (
    <HomeBannersProvider>
      <ToyNestHeader />
      <Box component="main" sx={{ bgcolor: "common.white", pb: 2 }}>
        <HeroCarousel />
        <CategorySelection />
        <TrendingProducts />
        <PromoBanner />
        <FeaturedProducts filter="isRecommended" title="Recommended for You" />
        <TrustStrip />
      </Box>
      <ToyNestFooter />
    </HomeBannersProvider>
  );
}

export { CategoryCard } from "./CategoryCard";
export { CategorySelection } from "./CategorySelection";
export { ProductCard } from "./ProductCard";
export { ProductSectionTray } from "./ProductSectionTray";
export { SectionHeader } from "./SectionHeader";
export type {
  CategoryCardData,
  ProductCardData,
  ProductSectionData,
  TrustCardData,
} from "./types";
