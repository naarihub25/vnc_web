import { GuestCheckoutDialog } from "@/components/site/GuestCheckoutDialog";
import { AppDialog } from "@/components/common/AppDialog";
import { useGuestCheckout } from "@/hooks/useGuestCheckout";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { cartItemKey, removeCartItem, setCartQuantity, useCart } from "@/hooks/useCart";
import { Seo } from "@/components/site/Seo";
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
export default function CartPage() {
  const { items, count } = useCart();
  const { guest, ready } = useGuestCheckout();
  const [reuseOpen, setReuseOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState("");
  const totals = items.reduce<Record<string, number>>((current, item) => {
    current[item.currency] = (current[item.currency] ?? 0) + Math.round(item.price * 100) * item.quantity;
    return current;
  }, {});
  const act = (operation: () => void) => { try { operation(); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update cart."); } };
  return <>
    <Seo title="Your Cart" description="Review products in your VnU shopping cart." canonicalPath="/cart" noIndex /><ToyNestHeader />
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, minHeight: "55vh" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}><Typography component="h1" variant="h4">Your Cart</Typography><Button component={Link} href="/">Continue shopping</Button></Stack>
      {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert> : null}
      {!items.length ? <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}><Typography variant="h5">Your cart is empty</Typography><Typography color="text.secondary" sx={{ my: 2 }}>Find something vibrant and unique to bring home.</Typography><Button component={Link} href="/" variant="contained">Explore products</Button></Paper> :
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}><Stack spacing={2}>{items.map((item) => {
            const key = cartItemKey(item);
            const href = `${item.wholesale ? "/wholesale" : ""}/products/${encodeURIComponent(item.slug || item.id)}`;
            return <Paper key={key} variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box component={Link} href={href} sx={{ flexShrink: 0 }}>{item.image ? <Box component="img" src={item.image} alt={item.name} sx={{ width: 120, height: 130, objectFit: "contain", bgcolor: "primary.light", borderRadius: 2 }} /> : null}</Box>
                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  <Typography component={Link} href={href} variant="h6">{item.name}</Typography>
                  <Box><Chip size="small" label={item.wholesale ? "Wholesale" : "Retail"} variant="outlined" /></Box>
                  <Typography color="text.secondary">{money(item.price, item.currency)} per unit</Typography>
                  {item.wholesale ? <Typography variant="caption">Minimum order: {item.minimum} units</Typography> : null}
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <IconButton aria-label={`Decrease quantity of ${item.name}`} disabled={item.quantity <= item.minimum} onClick={() => act(() => setCartQuantity(key, item.quantity - 1))}><RemoveIcon /></IconButton>
                    <Typography aria-live="polite">{item.quantity}</Typography>
                    <IconButton aria-label={`Increase quantity of ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => act(() => setCartQuantity(key, item.quantity + 1))}><AddIcon /></IconButton>
                    <Button color="secondary" startIcon={<DeleteOutlineIcon />} onClick={() => act(() => removeCartItem(key))}>Remove</Button>
                  </Stack>
                </Stack>
                <Typography sx={{ fontWeight: 800 }}>{money(Math.round(item.price * 100) * item.quantity / 100, item.currency)}</Typography>
              </Stack>
            </Paper>;
          })}</Stack></Grid>
          <Grid size={{ xs: 12, md: 4 }}><Paper variant="outlined" sx={{ p: 3, position: "sticky", top: 24 }}>
            <Typography variant="h6">Order summary</Typography><Typography color="text.secondary" sx={{ my: 2 }}>{count} items</Typography><Divider />
            {Object.entries(totals).map(([currency, cents]) => <Stack key={currency} direction="row" sx={{ justifyContent: "space-between", my: 2 }}><Typography>Subtotal ({currency})</Typography><Typography sx={{ fontWeight: 800 }}>{money(cents / 100, currency)}</Typography></Stack>)}
            <Typography variant="body2" color="text.secondary">Shipping and final charges will be confirmed at checkout.</Typography>
            <Button fullWidth disabled={!ready} variant="contained" sx={{ mt: 3 }} onClick={() => guest ? setReuseOpen(true) : setCheckoutOpen(true)}>Checkout</Button>
            <Typography variant="caption" color="text.secondary">Continue as a guest. Your cart expires 5 minutes after your last cart change.</Typography>
          </Paper></Grid>
        </Grid>}
    </Container>
    <AppDialog open={reuseOpen} onClose={() => setReuseOpen(false)} title="Use your saved details?"
      actions={<>
        <Button onClick={() => setReuseOpen(false)}>Cancel</Button>
        <Button disabled={!items.length} onClick={() => { setReuseOpen(false); setCheckoutOpen(true); }}>Enter new details</Button>
        <Button component={Link} href="/checkout" disabled={!items.length || !guest} variant="contained">Use existing details</Button>
      </>}>
      <Typography>Would you like to use the guest details saved for this session or enter new details?</Typography>
      {guest ? <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>{guest.name}</Typography>
        <Typography>{guest.email}</Typography>
        <Typography>{guest.phone}</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Typography>{guest.address.line1}</Typography>
        {guest.address.line2 ? <Typography>{guest.address.line2}</Typography> : null}
        <Typography>{guest.address.city}, {guest.address.state} {guest.address.postalCode}</Typography>
        <Typography>{guest.address.country}</Typography>
      </Paper> : <Alert severity="info">Your saved details are no longer available. Please enter new details.</Alert>}
      {!items.length ? <Alert severity="warning">Your cart has expired or is empty. Add products before continuing.</Alert> : null}
    </AppDialog>
    {checkoutOpen ? <GuestCheckoutDialog open onClose={() => setCheckoutOpen(false)} /> : null}
    <ToyNestFooter />
  </>;
}
