import AddIcon from "@mui/icons-material/Add";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AdminLayout } from "@/components";
import { Seo } from "@/components/site/Seo";

const stats = [
  { icon: <CategoryOutlinedIcon />, label: "Categories", value: "26" },
  { icon: <Inventory2OutlinedIcon />, label: "Products", value: "184" },
  { icon: <PeopleAltOutlinedIcon />, label: "Users", value: "3 roles" },
  { icon: <ShoppingCartOutlinedIcon />, label: "Orders", value: "42" },
];

export default function AdminDashboard() {
  return (
    <>
      <Seo title="Admin Dashboard" description="Manage VnU catalog and ecommerce operations." canonicalPath="/admin/dashboard" noIndex />
      <AdminLayout
        subtitle="Overview of catalog and ecommerce operations."
        title="Dashboard"
      >
        <Grid container spacing={2.5}>
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, md: 3 }}>
              <Paper sx={{ p: 3 }} variant="outlined">
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      alignItems: "center",
                      bgcolor: "primary.light",
                      borderRadius: 2,
                      color: "primary.main",
                      display: "flex",
                      height: 48,
                      justifyContent: "center",
                      width: 48,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography color="text.secondary">{stat.label}</Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ mt: 3, p: 3 }} variant="outlined">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h5">Catalog Setup</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Start by adding categories and then connect products to them.
              </Typography>
            </Box>
            <Button href="/admin/categories" startIcon={<AddIcon />} variant="contained">
              Manage Categories
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ mt: 3, p: 3 }} variant="outlined">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h5">User Access</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Admin and Sales Manager users can operate the admin panel. End
                users stay limited to website flows.
              </Typography>
            </Box>
            <Button href="/admin/users" startIcon={<PeopleAltOutlinedIcon />} variant="outlined">
              Manage Users
            </Button>
          </Stack>
        </Paper>
      </AdminLayout>
    </>
  );
}
