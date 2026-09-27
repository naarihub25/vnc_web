import { BrandLogo } from "@/components/common/BrandLogo";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ViewCarouselOutlinedIcon from "@mui/icons-material/ViewCarouselOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type ReactNode } from "react";
import { AdminHeader } from "./AdminHeader";
import { useAdminUser } from "@/hooks/useAdminUser";

const drawerWidth = 260;

const navItems = [
  { href: "/admin/dashboard", icon: <DashboardOutlinedIcon />, label: "Dashboard" },
  { href: "/admin/orders", icon: <ReceiptLongOutlinedIcon />, label: "Orders" },
  { href: "/admin/categories", icon: <CategoryOutlinedIcon />, label: "Categories" },
  { href: "/admin/products", icon: <Inventory2OutlinedIcon />, label: "Products" },
  { href: "/admin/banners", icon: <ViewCarouselOutlinedIcon />, label: "Banners" },
  { href: "/admin/users", icon: <PeopleAltOutlinedIcon />, label: "Users" },
  { href: "#", icon: <SettingsOutlinedIcon />, label: "Settings" },
];

export type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { user } = useAdminUser();

  const drawer = (
    <Box>
      <Toolbar sx={{ minHeight: 68 }}>
        <BrandLogo href="/admin/dashboard" size={64} label="Admin" />
      </Toolbar>
      <Divider />
      <List sx={{ p: 1.5 }}>
        {navItems.map((item) => {
          const selected = router.pathname === item.href;
          const disabled = item.href === "#";

          return (
            <ListItemButton
              component={disabled ? "button" : Link}
              disabled={disabled}
              href={disabled ? undefined : item.href}
              key={item.label}
              selected={selected}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AdminHeader
        containerMaxWidth={false}
        hideMenuOnDesktop
        logoText="VNUC Admin"
        onMenuClick={() => setMobileOpen(true)}
        onLogout={() => {
          localStorage.removeItem("vnucAdminToken");
          sessionStorage.removeItem("vnucAdminToken");
          localStorage.removeItem("vnucAdminUser");
          sessionStorage.removeItem("vnucAdminUser");
          router.push("/admin");
        }}
        position="fixed"
        sx={{
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
        userName={user?.name || user?.email || "Admin"}
        userEmail={user?.email}
        userRole={user?.role}
      />
      <Box
        component="nav"
        sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}
      >
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          variant="temporary"
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          variant="permanent"
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: "68px",
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography component="h1" variant="h4">
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
