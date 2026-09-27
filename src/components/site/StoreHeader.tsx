import Box from "@mui/material/Box";
import { StoreSearch } from "./StoreSearch";
import { useCart } from "@/hooks/useCart";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useState } from "react";
import { CategoryNavigation } from "./CategoryNavigation";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";

export type StoreHeaderVariant = "retail" | "wholesale";

export type StoreHeaderProps = {
  variant?: StoreHeaderVariant;
  logoText?: string;
  cartCount?: number;
  navItems?: string[];
  onMenuClick?: () => void;
  onLoginClick?: () => void;
};

export function StoreHeader({
  variant = "retail",
  onMenuClick,
}: StoreHeaderProps) {
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isWholesale = variant === "wholesale";

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="sticky"
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 0, minHeight: { xs: 72, md: 84 } }}>
          <BrandLogo size={64} label={isWholesale ? "Wholesale" : undefined} />
          <IconButton
            aria-label="Open menu"
            onClick={() => { setMobileOpen(true); onMenuClick?.(); }}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <CategoryNavigation wholesale={isWholesale} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
          <Box sx={{ display: { xs: "none", lg: "block" }, flex: "0 1 360px", minWidth: 240, maxWidth: 420, ml: 2 }}>
            <StoreSearch wholesale={isWholesale} />
          </Box>
          <IconButton aria-label={`Cart, ${count} items`} href="/cart" sx={{ flexShrink: 0, ml: { xs: "auto", md: 2 } }}>
            <Badge badgeContent={count} color="secondary">
              <ShoppingBagOutlinedIcon />
            </Badge>
          </IconButton>
        </Toolbar>
        <Box sx={{ display: { xs: "block", lg: "none" }, pb: 2, maxWidth: 680, mx: "auto" }}>
          <StoreSearch wholesale={isWholesale} />
        </Box>
      </Container>
    </AppBar>
  );
}
