import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Seo } from "@/components/site/Seo";
import {
  ActionIconButtons,
  AdminHeader,
  AppCheckbox,
  AppDialog,
  AppFooter,
  AppTextField,
  DataTable,
  StoreHeader,
  type DataTableColumn,
} from "@/components";

type CategoryRow = {
  id: number;
  name: string;
  subCategories: number;
  channel: "Retail" | "Wholesale" | "Both";
  status: "Active" | "Draft";
};

const rows: CategoryRow[] = [
  { id: 1, name: "Kids", subCategories: 8, channel: "Both", status: "Active" },
  {
    id: 2,
    name: "Gifting Items",
    subCategories: 12,
    channel: "Retail",
    status: "Active",
  },
  {
    id: 3,
    name: "Home Decor",
    subCategories: 6,
    channel: "Wholesale",
    status: "Draft",
  },
];

const columns: DataTableColumn<CategoryRow>[] = [
  { id: "name", label: "Category", minWidth: 180, render: (row) => row.name },
  {
    id: "subCategories",
    label: "Sub Categories",
    align: "center",
    render: (row) => row.subCategories,
  },
  { id: "channel", label: "Channel", render: (row) => row.channel },
  {
    id: "status",
    label: "Status",
    render: (row) => (
      <Chip
        color={row.status === "Active" ? "success" : "default"}
        label={row.status}
        size="small"
        variant={row.status === "Active" ? "filled" : "outlined"}
      />
    ),
  },
  {
    id: "actions",
    label: "Actions",
    align: "right",
    render: () => (
      <ActionIconButtons
        onDelete={() => undefined}
        onEdit={() => undefined}
        onView={() => undefined}
      />
    ),
  },
];

export default function ComponentGallery() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <Seo title="Component Gallery" description="Internal VnU component gallery." canonicalPath="/dev/components" noIndex />
      <StoreHeader cartCount={2} onLoginClick={() => setLoginOpen(true)} />
      <Box component="main">
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={4}>
            <Box>
              <Typography component="h1" variant="h3">
                Component Gallery
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Development route for reusable admin, retail and wholesale UI.
              </Typography>
            </Box>

            <Paper sx={{ p: { xs: 2, md: 3 } }} variant="outlined">
              <Typography sx={{ mb: 2 }} variant="h5">
                Form Components
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <AppTextField label="Input box" placeholder="Category name" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <AppTextField label="Password input" type="password" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <AppCheckbox defaultChecked label="Checkbox component" />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ overflow: "hidden" }} variant="outlined">
              <AdminHeader logoText="VnU Admin Panel" userName="Gurunath" />
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">Listing Table</Typography>
                  <Button startIcon={<AddIcon />} variant="contained">
                    Add Category
                  </Button>
                </Stack>
                <DataTable columns={columns} getRowKey={(row) => row.id} rows={rows} />
              </Box>
            </Paper>

            <Paper sx={{ overflow: "hidden" }} variant="outlined">
              <StoreHeader
                cartCount={12}
                logoText="VnU Wholesale"
                navItems={["Bulk Gifts", "Kids Sets", "Decor", "Corporate"]}
                variant="wholesale"
              />
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h5">Wholesale Header</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Header component in wholesale mode.
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </Container>
      </Box>
      <AppFooter />

      <AppDialog
        actions={
          <>
            <Button onClick={() => setLoginOpen(false)}>Cancel</Button>
            <Button variant="contained">Login</Button>
          </>
        }
        onClose={() => setLoginOpen(false)}
        open={loginOpen}
        title="Login"
      >
        <AppTextField label="Email" type="email" />
        <AppTextField label="Password" type="password" />
        <AppCheckbox label="Remember me" />
      </AppDialog>
    </>
  );
}
