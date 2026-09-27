import { BrandLogo } from "@/components/common/BrandLogo";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/router";
import { useEffect, useState, type FormEvent } from "react";
import { Seo } from "@/components/site/Seo";
import { AppCheckbox, AppTextField } from "@/components";
import { useAdminUser } from "@/hooks/useAdminUser";

export default function AdminLogin() {
  const router = useRouter();
  const { user, ready } = useAdminUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.isReady && user) {
      void router.replace("/admin/dashboard");
    }
  }, [router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();

      if (!response.ok || result?.flag !== true) {
        setError(
          typeof result?.error === "string"
            ? result.error
            : "Unable to sign in. Please try again."
        );
        return;
      }

      if (!result.data || typeof result.data._id !== "string" ||
          result.data.role !== "admin" || result.data.isActive !== true) {
        setError("Unable to sign in with this admin account.");
        return;
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      localStorage.removeItem("vnucAdminToken");
      sessionStorage.removeItem("vnucAdminToken");
      localStorage.removeItem("vnucAdminUser");
      sessionStorage.removeItem("vnucAdminUser");
      storage.setItem("vnucAdminUser", JSON.stringify(result.data));
      await router.replace("/admin/dashboard");
    } catch {
      setError("Unable to complete sign in. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || user) {
    return (
      <Box role="status" sx={{ p: 4, textAlign: "center" }}>
        {user ? "Opening dashboard..." : "Checking your session..."}
      </Box>
    );
  }

  return (
    <>
      <Seo title="Admin Login" description="Sign in to the VnU administration portal." canonicalPath="/admin" noIndex />
      <Box
        component="main"
        sx={{
          alignItems: "center",
          bgcolor: "background.default",
          display: "flex",
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Container maxWidth="xs">
          <Paper sx={{ p: { xs: 3, sm: 4 } }} variant="outlined">
            <Box sx={{ mb: 2 }}><BrandLogo size={112} /></Box>
            <Typography
              sx={{ color: "primary.main", fontWeight: 800, mb: 1 }}
              variant="h4"
            >
              VnU Admin
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Sign in to manage your catalog, users and operations.
            </Typography>
            <Stack component="form" onSubmit={handleSubmit} spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <AppTextField
                autoComplete="email"
                label="Email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
              <AppTextField
                autoComplete="current-password"
                label="Password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <AppCheckbox
                checked={rememberMe}
                label="Remember me"
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <Button
                disabled={loading}
                endIcon={<LoginOutlinedIcon />}
                size="large"
                type="submit"
                variant="contained"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
