import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppFooter, StoreHeader } from "@/components";
import { Seo } from "@/components/site/Seo";

const benefits = ["Bulk pricing", "Corporate gifting", "Dealer support"];

export default function WholesaleHome() {
  return (
    <>
      <Seo title="Wholesale Toys and Gifts" canonicalPath="/wholesale"
        description="Order VnU toys, gifts and lifestyle products in bulk with wholesale pricing and dealer support."
        keywords={["wholesale toys", "bulk gifts", "corporate gifting", "VnU wholesale"]} />
      <StoreHeader
        cartCount={12}
        logoText="VnU Wholesale"
        variant="wholesale"
      />
      <Box component="main">
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography component="h1" sx={{ maxWidth: 760 }} variant="h3">
                Wholesale ordering for gifting, kids and lifestyle categories.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 650 }}
                variant="h6"
              >
                Build bulk enquiry, quotation and dealer pricing flows from this
                route.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 3 }}
              >
                <Button
                  startIcon={<BusinessCenterOutlinedIcon />}
                  variant="contained"
                >
                  Start Bulk Enquiry
                </Button>
                <Button href="/" variant="outlined">
                  Retail Store
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3 }} variant="outlined">
                <Typography variant="h6">Wholesale Benefits</Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {benefits.map((benefit) => (
                    <Box
                      key={benefit}
                      sx={{
                        bgcolor: "background.default",
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                      }}
                    >
                      {benefit}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <AppFooter />
    </>
  );
}
