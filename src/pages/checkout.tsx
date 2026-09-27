import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useGuestCheckout } from "@/hooks/useGuestCheckout";
import { useCart, cartItemKey, getCartItems, clearOrderedCart } from "@/hooks/useCart";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { Seo } from "@/components/site/Seo";
import { createRazorpayPayment, fetchRazorpayMethods, type RazorpayMethods, type RazorpayPaymentData } from "@/lib/razorpay";
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
type OrderConfirmation = {
  _id: string;
  currency: string;
  subtotal: number;
  status: string;
  paymentMethod: string;
  payment: { status: string; providerOrderId?: string; transactionId?: string };
  razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
};
function razorpayOrderFromResponse(result: unknown): OrderConfirmation | null {
  if (!result || typeof result !== "object") return null;
  const envelope = result as Record<string, unknown>;
  const data = envelope.data && typeof envelope.data === "object" ? envelope.data as Record<string, unknown> : envelope;
  const nestedOrder = data.order && typeof data.order === "object" ? data.order as Record<string, unknown> : data;
  const razorpay = data.razorpay && typeof data.razorpay === "object" ? data.razorpay as Record<string, unknown> : {};
  const nestedPayment = nestedOrder.payment && typeof nestedOrder.payment === "object" ? nestedOrder.payment as Record<string, unknown> : {};
  const internalId = nestedOrder._id ?? data.internalOrderId ?? data.orderId;
  const providerOrderId = razorpay.orderId ?? nestedPayment.providerOrderId;
  const currency = razorpay.currency ?? nestedOrder.currency;
  const amount = razorpay.amount;
  const subtotal = nestedOrder.subtotal ?? (typeof amount === "number" ? amount / 100 : undefined);
  if (typeof internalId !== "string" || typeof razorpay.keyId !== "string" || typeof providerOrderId !== "string" || typeof amount !== "number" || typeof currency !== "string" || typeof subtotal !== "number") return null;
  return {
    _id: internalId,
    currency,
    subtotal,
    status: typeof nestedOrder.status === "string" ? nestedOrder.status : "pending",
    paymentMethod: "online",
    payment: {
      status: typeof nestedPayment.status === "string" ? nestedPayment.status : "pending",
      providerOrderId,
      transactionId: typeof nestedPayment.transactionId === "string" ? nestedPayment.transactionId : undefined,
    },
    razorpay: { keyId: razorpay.keyId, orderId: providerOrderId, amount, currency },
  };
}
export default function CheckoutPage() {
  const router = useRouter();
  const { guest, ready } = useGuestCheckout();
  const { items, count } = useCart();
  const [payment, setPayment] = useState<"online" | "cod">("cod");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placed, setPlaced] = useState(false);
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<OrderConfirmation | null>(null);
  const [onlineMethod, setOnlineMethod] = useState<"card" | "upi" | "netbanking">("upi");
  const [methods, setMethods] = useState<RazorpayMethods | null>(null);
  const [methodsFallback, setMethodsFallback] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("");
  const [card, setCard] = useState({ name: "", number: "", expiryMonth: "", expiryYear: "", cvv: "" });
  const submitting = useRef(false);
  const consentKey = JSON.stringify({ userId: guest?.guestId, items, payment });
  const [acceptedKey, setAcceptedKey] = useState("");
  const hasConsent = consent && acceptedKey === consentKey;
  const prepareOnlineOrder = async () => {
    if (submitting.current || pendingOnlineOrder) return;
    setOrderError("");
    if (!guest?.guestId || !/^[a-fA-F0-9]{24}$/.test(guest.guestId)) { setOrderError("Your saved guest ID is missing. Return to the cart and enter new guest details."); return; }
    const currentItems = getCartItems();
    if (!currentItems.length || JSON.stringify(currentItems) !== JSON.stringify(items)) { setOrderError("Your cart has expired or changed. Please review it before continuing."); return; }
    const quantities = new Map<string, number>();
    for (const item of currentItems) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
    const orderItems = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
    if (orderItems.some((item) => !/^[a-fA-F0-9]{24}$/.test(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000000000)) {
      setOrderError("One or more cart items are invalid. Please update your cart."); return;
    }
    submitting.current = true; setSaving(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const response = await fetch(`${base}/api/payments/razorpay/orders`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: guest.guestId, items: orderItems }),
      });
      const result = await response.json().catch(() => null);
      if (response.status !== 201 || result?.flag !== true || result?.error) {
        setOrderError(typeof result?.error === "string" ? result.error : "Unable to prepare online payment. Please try again."); return;
      }
      const prepared = razorpayOrderFromResponse(result);
      if (!prepared) { setOrderError("The payment service returned incomplete Razorpay order details. Please contact support."); return; }
      setPendingOnlineOrder(prepared);
    } catch {
      setOrderError("Unable to prepare online payment. Check your connection and try again.");
    } finally { submitting.current = false; setSaving(false); }
  };
  const placeOrder = async () => {
    if (submitting.current || placed) return;
    setOrderError("");
    if (payment === "online" && !pendingOnlineOrder) { setOrderError("Confirm online payment below the payment option before continuing."); return; }
    if (!hasConsent) { setOrderError(`Please confirm that you agree to ${payment === "online" ? "pay online" : "pay by cash on delivery"}.`); return; }
    if (!guest?.guestId || !/^[a-fA-F0-9]{24}$/.test(guest.guestId)) { setOrderError("Your saved guest ID is missing. Return to the cart and enter new guest details."); return; }
    const currentItems = getCartItems();
    if (!currentItems.length || JSON.stringify(currentItems) !== JSON.stringify(items)) { setOrderError("Your cart has expired or changed. Please review it before ordering."); return; }
    const quantities = new Map<string, number>();
    for (const item of currentItems) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
    const orderItems = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
    if (orderItems.some((item) => !/^[a-fA-F0-9]{24}$/.test(item.productId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000000000)) {
      setOrderError("One or more cart items are invalid. Please update your cart."); return;
    }
    submitting.current = true; setSaving(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      let confirmed = payment === "online" ? pendingOnlineOrder : null;
      if (!confirmed) {
        const response = await fetch(`${base}/api/orders`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "cod", userId: guest.guestId, items: orderItems }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.flag !== true || result?.error) {
          setOrderError(typeof result?.error === "string" ? result.error : "Unable to place your order. Please try again."); return;
        }
        confirmed = result.data;
      }
      if (!confirmed || typeof confirmed._id !== "string" || typeof confirmed.currency !== "string" ||
          !Number.isFinite(confirmed.subtotal) || typeof confirmed.status !== "string" ||
          confirmed.paymentMethod !== payment || typeof confirmed.payment?.status !== "string") {
        setOrderError("The server reported success but returned incomplete order details. Please check with support before ordering again.");
        setPlaced(true);
        return;
      }
      if (payment === "online") {
        const key = confirmed.razorpay?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const providerOrderId = confirmed.razorpay?.orderId ?? confirmed.payment.providerOrderId;
        const paymentCurrency = confirmed.razorpay?.currency ?? confirmed.currency;
        const paymentAmount = confirmed.razorpay?.amount ?? Math.round(confirmed.subtotal * 100);
        if (!key) { setOrderError("The Razorpay key ID was not returned by the server. Please contact support."); return; }
        if (!providerOrderId) { setOrderError("The payment order ID was not returned by the server. Please contact support before retrying."); return; }
        if (paymentCurrency !== "INR") { setOrderError("Online payment currently supports INR orders only."); return; }
        const digits = card.number.replace(/\s/g, "");
        if (onlineMethod === "upi" && !/^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(upiId.trim())) { setOrderError("Enter a valid UPI ID, for example name@bank."); return; }
        if (onlineMethod === "netbanking" && !bank) { setOrderError("Select your bank to continue."); return; }
        if (onlineMethod === "card" && (!card.name.trim() || !/^\d{12,19}$/.test(digits) || !/^(0?[1-9]|1[0-2])$/.test(card.expiryMonth) || !/^\d{2}(\d{2})?$/.test(card.expiryYear) || !/^\d{3,4}$/.test(card.cvv))) {
          setOrderError("Enter valid cardholder, card number, expiry and CVV details."); return;
        }
        const paymentData: RazorpayPaymentData = {
          amount: paymentAmount, currency: paymentCurrency,
          email: guest.email, contact: guest.phone, order_id: providerOrderId,
          method: onlineMethod, description: `VnU order ${confirmed._id}`, notes: { orderId: confirmed._id },
          ...(onlineMethod === "upi" ? { upi: { vpa: upiId.trim(), flow: "collect" as const } } : {}),
          ...(onlineMethod === "netbanking" ? { bank } : {}),
          ...(onlineMethod === "card" ? {
            "card[name]": card.name.trim(), "card[number]": digits, "card[cvv]": card.cvv,
            "card[expiry_month]": card.expiryMonth.padStart(2, "0"), "card[expiry_year]": card.expiryYear,
          } : {}),
        };
        const checkout = await createRazorpayPayment(key, paymentData);
        if (checkout.status === "failed") {
          console.error("Razorpay payment error", checkout.details);
          const reference = [checkout.details?.code, checkout.details?.reason].filter(Boolean).join(" · ");
          setOrderError(`${checkout.message}${reference ? ` (${reference})` : ""}`); return;
        }
        const verifyResponse = await fetch(`${base}/api/payments/razorpay/verify`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: checkout.payment.razorpay_order_id,
            razorpay_payment_id: checkout.payment.razorpay_payment_id,
            razorpay_signature: checkout.payment.razorpay_signature,
          }),
        });
        const verification = await verifyResponse.json().catch(() => null);
        if (!verifyResponse.ok || verification?.flag !== true || verification?.error) {
          setOrder(confirmed); setPlaced(true);
          setOrderError(typeof verification?.error === "string" ? verification.error : "Payment was submitted, but verification is still pending. Do not pay again; contact support with your order ID.");
          return;
        }
        const verified = verification.data;
        if (!verified || typeof verified._id !== "string" || verified.payment?.status !== "paid") {
          setOrder(confirmed); setPlaced(true);
          setOrderError("Payment was submitted, but the server did not confirm it as paid. Do not pay again; contact support with your order ID.");
          return;
        }
        confirmed = verified;
      }
      setOrder(confirmed);
      setPlaced(true);
      try { clearOrderedCart(currentItems); }
      catch { setOrderError("Your order was placed, but the cart could not be cleared. Do not submit it again."); }
    } catch {
      setOrderError("We could not confirm whether your order was placed. Please check with support before trying again to avoid a duplicate order.");
    } finally { submitting.current = false; setSaving(false); }
  };
  useEffect(() => { if (ready && !guest) void router.replace("/cart"); }, [ready, guest, router]);
  useEffect(() => {
    if (payment !== "online") return;
    const key = pendingOnlineOrder?.razorpay?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) return;
    let active = true;
    void fetchRazorpayMethods(key).then((result) => {
      if (!active) return;
      setMethods(result.methods); setMethodsFallback(result.fallback);
      if (result.methods.upi) setOnlineMethod("upi");
      else if (result.methods.card) setOnlineMethod("card");
      else if (Object.keys(result.methods.netbanking).length) setOnlineMethod("netbanking");
    });
    return () => { active = false; };
  }, [payment, pendingOnlineOrder?.razorpay?.keyId]);
  const totals = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.currency] = (acc[item.currency] ?? 0) + Math.round(item.price * 100) * item.quantity;
    return acc;
  }, {});
  const onlineReady = payment !== "online" || Boolean(pendingOnlineOrder && (pendingOnlineOrder.razorpay?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) && methods &&
    ((onlineMethod === "upi" && methods.upi) || (onlineMethod === "card" && methods.card) || (onlineMethod === "netbanking" && Object.keys(methods.netbanking).length)));
  return <>
    <Seo title="Checkout" description="Complete your VnU order and confirm delivery and payment details." canonicalPath="/checkout" noIndex /><ToyNestHeader />
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, minHeight: "55vh" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 3 }}><Typography component="h1" variant="h4">Checkout</Typography><Button component={Link} href="/cart">Back to cart</Button></Stack>
      {placed ? <Paper variant="outlined" sx={{ p: 4 }}>
        {order ? <>
          <Alert severity="success">{order.paymentMethod === "online" ? "Your payment is confirmed and your order has been placed." : "Your cash-on-delivery order has been placed."}</Alert>
          <Stack spacing={1} sx={{ my: 2 }}>
            <Typography>Order ID: {order._id}</Typography>
            <Typography>Confirmed subtotal: {money(order.subtotal, order.currency)}</Typography>
            <Typography sx={{ textTransform: "capitalize" }}>Order status: {order.status}</Typography>
            <Typography sx={{ textTransform: "capitalize" }}>Payment status: {order.payment.status}</Typography>
          </Stack>
          <Typography sx={{ my: 2 }}>{order.paymentMethod === "online" ? "Payment method: Razorpay online payment." : "Payment method: Cash on Delivery. Please pay when your order is delivered."}</Typography>
        </> : null}
        {orderError ? <Alert severity="warning" sx={{ mb: 2 }}>{orderError}</Alert> : null}
        <Button component={Link} href="/" variant="contained">Continue shopping</Button>
      </Paper> : !ready || !guest ? <Typography role="status">Loading checkout...</Typography> : !items.length && !saving ? <Alert severity="warning">Your cart has expired or is empty. <Link href="/">Continue shopping</Link> to add products.</Alert> :
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}><Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Delivery details</Typography>
            <Typography sx={{ fontWeight: 700 }}>{guest.name}</Typography>
            <Typography>{guest.address.line1}</Typography>
            {guest.address.line2 ? <Typography>{guest.address.line2}</Typography> : null}
            <Typography>{guest.address.city}, {guest.address.state} {guest.address.postalCode}</Typography>
            <Typography>{guest.address.country}</Typography>
            <Divider sx={{ my: 2 }} /><Typography>{guest.email}</Typography><Typography>{guest.phone}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <FormControl fullWidth disabled={saving}>
              <FormLabel id="payment-method-label" sx={{ fontWeight: 700, mb: 2 }}>Payment method</FormLabel>
              <RadioGroup aria-labelledby="payment-method-label" value={payment} onChange={(event) => setPayment(event.target.value as "online" | "cod")}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: payment === "online" ? "primary.main" : "divider" }}>
                  <FormControlLabel value="online" control={<Radio />} label="Online Payment" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>Pay securely using the UPI, card or netbanking methods enabled on Razorpay.</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderColor: payment === "cod" ? "primary.main" : "divider" }}>
                  <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>Pay when your order is delivered.</Typography>
                </Paper>
              </RadioGroup>
              {payment === "online" ? <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Choose how to pay</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Your payment details go directly to Razorpay and are not stored by VnU.</Typography>
                {!pendingOnlineOrder ? <Alert severity="info">
                  <Typography sx={{ fontWeight: 700 }}>Do you want to continue with online payment?</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>Choosing Yes creates your order ID and loads the payment methods available from Razorpay.</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" size="small" disabled={saving || !guest.guestId || !items.length} onClick={() => void prepareOnlineOrder()}>{saving ? "Preparing..." : "Yes, continue"}</Button>
                    <Button variant="outlined" size="small" disabled={saving} onClick={() => { setPayment("cod"); setOrderError(""); }}>No</Button>
                  </Stack>
                </Alert> :
                  !(pendingOnlineOrder.razorpay?.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) ? <Alert severity="warning">The Razorpay key ID was not returned by the server.</Alert> : !methods ?
                  <Typography role="status">Loading available payment methods...</Typography> : methods ? <>
                    {methodsFallback ? <Alert severity="info" sx={{ mb: 2 }}>We could not load your complete Razorpay method list. Card and UPI remain available; retry this page to refresh the list.</Alert> : null}
                    <RadioGroup row aria-label="Online payment method" value={onlineMethod} onChange={(event) => setOnlineMethod(event.target.value as "card" | "upi" | "netbanking")}>
                      {methods.upi ? <FormControlLabel value="upi" control={<Radio />} label="UPI" /> : null}
                      {methods.card ? <FormControlLabel value="card" control={<Radio />} label="Card" /> : null}
                      {Object.keys(methods.netbanking).length ? <FormControlLabel value="netbanking" control={<Radio />} label="Netbanking" /> : null}
                    </RadioGroup>
                    {onlineMethod === "upi" && methods.upi ? <TextField fullWidth label="UPI ID" value={upiId} onChange={(event) => setUpiId(event.target.value)}
                      placeholder="name@bank" autoComplete="off" helperText="You will approve the collect request in your UPI app." /> : null}
                    {onlineMethod === "netbanking" && Object.keys(methods.netbanking).length ? <TextField select fullWidth label="Bank" value={bank} onChange={(event) => setBank(event.target.value)} helperText="Banks enabled on your Razorpay account are shown here.">
                      {Object.entries(methods.netbanking).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => <MenuItem key={code} value={code}>{name}</MenuItem>)}
                    </TextField> : null}
                    {onlineMethod === "card" && methods.card ? <Grid container spacing={2}>
                      <Grid size={12}><TextField fullWidth label="Name on card" value={card.name} onChange={(event) => setCard((value) => ({ ...value, name: event.target.value }))} autoComplete="cc-name" /></Grid>
                      <Grid size={12}><TextField fullWidth label="Card number" value={card.number} onChange={(event) => setCard((value) => ({ ...value, number: event.target.value.replace(/[^\d ]/g, "").slice(0, 23) }))}
                        autoComplete="cc-number" slotProps={{ htmlInput: { inputMode: "numeric" } }} /></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><TextField fullWidth label="Expiry month" placeholder="MM" value={card.expiryMonth} onChange={(event) => setCard((value) => ({ ...value, expiryMonth: event.target.value.replace(/\D/g, "").slice(0, 2) }))}
                        autoComplete="cc-exp-month" slotProps={{ htmlInput: { inputMode: "numeric" } }} /></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><TextField fullWidth label="Expiry year" placeholder="YY" value={card.expiryYear} onChange={(event) => setCard((value) => ({ ...value, expiryYear: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                        autoComplete="cc-exp-year" slotProps={{ htmlInput: { inputMode: "numeric" } }} /></Grid>
                      <Grid size={{ xs: 6, sm: 4 }}><TextField fullWidth label="CVV" type="password" value={card.cvv} onChange={(event) => setCard((value) => ({ ...value, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                        autoComplete="cc-csc" slotProps={{ htmlInput: { inputMode: "numeric" } }} /></Grid>
                    </Grid> : null}
                    <FormHelperText sx={{ mt: 2 }}>Secured and processed by Razorpay.</FormHelperText>
                  </> : <Alert severity="error">Payment methods are unavailable. Refresh the page or choose cash on delivery.</Alert>}
              </Box> : null}
            </FormControl>
          </Paper>
        </Stack></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Order summary · {count} items</Typography>
          <Stack spacing={2}>{items.map((item) => <Stack key={cartItemKey(item)} direction="row" spacing={2} sx={{ alignItems: "center" }}>
            {item.image ? <Box component="img" src={item.image} alt={item.name} sx={{ width: 56, height: 64, objectFit: "contain", borderRadius: 1 }} /> : null}
            <Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.wholesale ? "Wholesale" : "Retail"} · Qty {item.quantity}</Typography></Box>
            <Typography variant="body2">{money(Math.round(item.price * 100) * item.quantity / 100, item.currency)}</Typography>
          </Stack>)}</Stack>
          <Divider sx={{ my: 3 }} />
          {Object.entries(totals).map(([currency, cents]) => <Stack key={currency} direction="row" sx={{ justifyContent: "space-between", mb: 2 }}><Typography>Subtotal ({currency})</Typography><Typography sx={{ fontWeight: 800 }}>{money(cents / 100, currency)}</Typography></Stack>)}
          <Typography variant="body2" color="text.secondary">The order service will confirm final pricing and availability.</Typography>
          {!guest.guestId ? <Alert severity="warning" sx={{ mt: 2 }}>Your guest ID is missing. Return to the cart and select “Enter new details” before ordering.</Alert> : null}
          {orderError ? <Alert severity="error" sx={{ mt: 2 }}>{orderError}</Alert> : null}
          <FormControlLabel sx={{ mt: 2 }} control={<Checkbox checked={hasConsent} disabled={saving} onChange={(event) => { setConsent(event.target.checked); setAcceptedKey(consentKey); }} />}
            label={`I confirm my delivery details and agree to ${payment === "online" ? "complete this payment securely through Razorpay" : "pay for this order by cash on delivery"}.`} />
          <Button disabled={saving || !hasConsent || !guest.guestId || !items.length || !onlineReady} fullWidth variant="contained" sx={{ mt: 3 }} onClick={placeOrder}>
            {saving ? (payment === "online" ? (pendingOnlineOrder ? "Processing payment..." : "Preparing payment...") : "Placing order...") :
              (payment === "online" ? (pendingOnlineOrder ? `Pay ${money(pendingOnlineOrder.subtotal, pendingOnlineOrder.currency)}` : "Confirm online payment above") : "Place cash-on-delivery order")}
          </Button>
        </Paper></Grid>
      </Grid>}
    </Container><ToyNestFooter />
  </>;
}
