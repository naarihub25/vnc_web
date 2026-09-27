import { BrandLogo } from "@/components/common/BrandLogo";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export type AdminHeaderProps = {
  logoText?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  containerMaxWidth?: "sm" | "md" | "lg" | "xl" | false;
  hideMenuOnDesktop?: boolean;
  position?: "absolute" | "fixed" | "relative" | "static" | "sticky";
  sx?: SxProps<Theme>;
  onMenuClick?: () => void;
  onLogout?: () => void;
};

export function AdminHeader({
  userName = "Admin",
  userEmail,
  userRole,
  containerMaxWidth = "xl",
  hideMenuOnDesktop = false,
  position = "sticky",
  sx,
  onMenuClick,
  onLogout,
}: AdminHeaderProps) {
  return (
    <AppBar
      color="inherit"
      elevation={0}
      position={position}
      sx={[{ borderBottom: 1, borderColor: "divider" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Container maxWidth={containerMaxWidth}>
        <Toolbar disableGutters sx={{ gap: 2, minHeight: 68 }}>
          <IconButton
            aria-label="Open menu"
            edge="start"
            onClick={onMenuClick}
            sx={{ display: hideMenuOnDesktop ? { md: "none" } : undefined }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}><BrandLogo href="/admin/dashboard" size={56} label="Admin" /></Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <IconButton aria-label="Notifications">
              <NotificationsNoneOutlinedIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.main", height: 34, width: 34 }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ maxWidth: { xs: 110, sm: 240 }, minWidth: 0 }}>
              <Typography noWrap title={userName} sx={{ fontWeight: 700 }} variant="body2">
                {userName}
              </Typography>
              {userEmail ? (
                <Typography noWrap title={userEmail} color="text.secondary" variant="caption"
                  sx={{ display: { xs: "none", sm: "block" } }}>
                  {userEmail}
                </Typography>
              ) : null}
              {userRole ? (
                <Typography color="text.secondary" variant="caption" sx={{ textTransform: "capitalize" }}>
                  {userRole}
                </Typography>
              ) : null}
            </Box>
            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutOutlinedIcon />}
              sx={{ display: { xs: "none", md: "inline-flex" } }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
