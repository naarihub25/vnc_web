import { useRef, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppDialog, AppTextField, DataTable } from "@/components";
import { ToyNestHeader, ToyNestFooter } from "@/components/site/home/ToyNestHome";
import { Seo } from "@/components/site/Seo";

type Order = {
  _id: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
  items: { product: string; name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }[];
  paymentMethod: string;
  payment: { status: string; transactionId?: string; paidAt?: string };
  currency: string; subtotal: number; status: string; statusReason?: string;
  logistics?: { logisticsId: string; logisticsName: string; trackingUrl?: string; notes?: string };
  createdAt: string; updatedAt: string;
};
type OrderPage = { orders: Order[]; total: number; page: number; totalPages: number };
const ordersUrl = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/orders`;
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
const date = (value: string) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
function safeUrl(value?: string) {
  try { return Boolean(value && ["http:", "https:"].includes(new URL(value).protocol)); } catch { return false; }
}

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "orders">("email");
  const [targetPage, setTargetPage] = useState(1);
  const [result, setResult] = useState<OrderPage | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const lock = useRef(false);
  const invoiceLock = useRef(false);
  const expiresAt = useRef(0);

  const requestOtp = async (page = 1) => {
    if (lock.current) return;
    const address = email.trim().toLowerCase();
    if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError("Enter a valid email address."); return; }
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${ordersUrl}/tracking/request-OTP`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error || data?.flag === false) throw new Error(typeof data?.error === "string" ? data.error : "Unable to send OTP. Please try again.");
      if (typeof data?.message !== "string" || typeof data.expiresIn !== "number" || !Number.isFinite(data.expiresIn) || data.expiresIn < 0) throw new Error("Unexpected OTP response. Please try again.");
      setEmail(address); setOtp(""); setTargetPage(page); setStep("otp");
      expiresAt.current = Date.now() + data.expiresIn * 1000;
      setNotice(`${data.message}${data.expiresIn > 0 ? ` Valid for ${Math.ceil(data.expiresIn / 60)} minute(s).` : ""}`);
      // Never display or auto-fill an OTP returned by development servers.
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send OTP."); }
    finally { lock.current = false; setBusy(false); }
  };
  const loadOrders = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current) return;
    if (!/^\d{4}$/.test(otp.trim())) { setError("Enter the four-digit OTP sent to your email."); return; }
    if (Date.now() >= expiresAt.current) { setError("Your OTP has expired. Request a new OTP below."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`${ordersUrl}/by-email`, {
        method: "POST", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim(), page: targetPage, limit: 20 }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error || data?.flag === false) throw new Error(typeof data?.error === "string" ? data.error : "Unable to verify OTP and load orders. Request a new OTP and try again.");
      if (!Array.isArray(data?.orders) || !Number.isSafeInteger(data.total) || data.total < 0 ||
        !Number.isSafeInteger(data.page) || data.page < 0 || !Number.isSafeInteger(data.totalPages) || data.totalPages < 0) throw new Error("Unexpected orders response. Request a new OTP and try again.");
      setResult({ orders: data.orders, total: data.total, page: data.page || targetPage, totalPages: Math.max(1, data.totalPages) });
      setStep("orders"); setOtp(""); setNotice("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load orders."); }
    finally { lock.current = false; setBusy(false); }
  };
  const downloadInvoice = async () => {
    if (!selected || invoiceLock.current) return;
    invoiceLock.current = true; setDownloading(true); setInvoiceError("");
    try {
      const response = await fetch(`${ordersUrl}/${encodeURIComponent(selected._id)}/invoice`, {
        credentials: "include", cache: "no-store", headers: { Accept: "application/pdf" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Unable to download invoice.");
      }
      const blob = await response.blob();
      if (!blob.size || !blob.type.toLowerCase().includes("application/pdf")) throw new Error("The server did not return a PDF invoice. Please try again.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `invoice-${selected._id}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setInvoiceError(cause instanceof Error ? cause.message : "Unable to download invoice."); }
    finally { invoiceLock.current = false; setDownloading(false); }
  };
  const reset = () => { setStep("email"); setOtp(""); setResult(null); setSelected(null); setError(""); setNotice(""); expiresAt.current = 0; };
  return <>
    <Seo title="Track My Order" description="Verify your email to view your VnU orders, shipment details and invoices." canonicalPath="/track-order" noIndex />
    <ToyNestHeader />
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, minHeight: "55vh" }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">Track My Order</Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {notice ? <Alert severity="info">{notice}</Alert> : null}
        {step === "email" ? <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
          <Stack component="form" spacing={2} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void requestOtp(); }}>
            <Typography>Enter the email address used at checkout to receive an OTP.</Typography>
            <AppTextField label="Email address" type="email" autoComplete="email" required disabled={busy} value={email}
              slotProps={{ htmlInput: { maxLength: 254 } }} onChange={(event) => setEmail(event.target.value)} />
            <Button type="submit" variant="contained" disabled={busy}>{busy ? "Sending OTP..." : "Send OTP"}</Button>
          </Stack>
        </Paper> : step === "otp" ? <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
          <Stack component="form" spacing={2} onSubmit={loadOrders}>
            <Typography sx={{ overflowWrap: "anywhere" }}>Enter the OTP sent to {email}.</Typography>
            {targetPage > 1 ? <Typography variant="body2">Verify to view page {targetPage} of your orders.</Typography> : null}
            <AppTextField label="OTP" required disabled={busy} autoComplete="one-time-code" value={otp}
              slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]{4}", maxLength: 4 } }}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))} />
            <Button type="submit" variant="contained" disabled={busy}>{busy ? "Please wait..." : "Verify and view orders"}</Button>
            <Stack direction="row" spacing={1}>
              <Button disabled={busy} onClick={() => void requestOtp(targetPage)}>Resend OTP</Button>
              <Button disabled={busy} onClick={reset}>Change email</Button>
            </Stack>
          </Stack>
        </Paper> : result ? <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between" }}>
            <Typography sx={{ overflowWrap: "anywhere" }}>{result.total} order(s) for {email}</Typography>
            <Button disabled={busy} onClick={reset}>Use another email</Button>
          </Stack>
          <DataTable rows={result.orders} getRowKey={(order) => order._id} emptyMessage="No orders found for this email." columns={[
            { id: "id", label: "Order", render: (order) => <Button sx={{ textTransform: "none", overflowWrap: "anywhere" }} onClick={() => { setSelected(order); setInvoiceError(""); }}>{order._id}</Button> },
            { id: "date", label: "Placed", render: (order) => date(order.createdAt) },
            { id: "items", label: "Items", render: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0) },
            { id: "amount", label: "Subtotal", render: (order) => money(order.subtotal, order.currency) },
            { id: "status", label: "Order status", render: (order) => <Chip size="small" label={order.status} /> },
            { id: "payment", label: "Payment", render: (order) => order.payment.status },
          ]} />
          {result.totalPages > 1 ? <>
            <Typography variant="body2" color="text.secondary">Each page requires a fresh OTP. Choose a page to receive a new code by email.</Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
              <Button disabled={busy || result.page <= 1} onClick={() => void requestOtp(result.page - 1)}>Previous</Button>
              <Typography>Page {result.page} of {result.totalPages}</Typography>
              <Button disabled={busy || result.page >= result.totalPages} onClick={() => void requestOtp(result.page + 1)}>Next</Button>
            </Stack>
          </> : null}
        </Stack> : null}
      </Stack>
    </Container>
    <ToyNestFooter />
    <AppDialog open={Boolean(selected)} onClose={() => { if (!invoiceLock.current) setSelected(null); }} title="Order details" maxWidth="md"
      actions={<><Button disabled={downloading} onClick={() => setSelected(null)}>Close</Button>
        <Button variant="contained" disabled={downloading || !selected || !["approved", "shipped", "delivered", "returned", "cancelled"].includes(selected.status)} onClick={() => void downloadInvoice()}>
          {downloading ? "Downloading..." : "Download invoice"}
        </Button></>}>
      {selected ? <>
        {invoiceError ? <Alert severity="error">{invoiceError}</Alert> : null}
        <Typography sx={{ overflowWrap: "anywhere" }}>Order: {selected._id}</Typography>
        <Typography variant="body2">Placed: {date(selected.createdAt)} · Updated: {date(selected.updatedAt)}</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}><Chip label={`Order: ${selected.status}`} /><Chip label={`Payment: ${selected.payment.status}`} /></Stack>
        {selected.statusReason ? <Alert severity="info">{selected.statusReason}</Alert> : null}
        <Typography variant="h6">Customer and delivery</Typography>
        <Typography sx={{ overflowWrap: "anywhere" }}>{selected.customer.name} · {selected.customer.email} · {selected.customer.phone}</Typography>
        <Typography>{[selected.shippingAddress.line1, selected.shippingAddress.line2, selected.shippingAddress.city, selected.shippingAddress.state, selected.shippingAddress.postalCode, selected.shippingAddress.country].filter(Boolean).join(", ")}</Typography>
        <DataTable rows={selected.items} getRowKey={(item) => `${item.product}:${item.sku}`} columns={[
          { id: "name", label: "Product", render: (item) => item.name },
          { id: "sku", label: "SKU", render: (item) => item.sku },
          { id: "quantity", label: "Quantity", render: (item) => item.quantity },
          { id: "price", label: "Unit price", render: (item) => money(item.unitPrice, selected.currency) },
          { id: "total", label: "Total", render: (item) => money(item.lineTotal, selected.currency) },
        ]} />
        <Typography sx={{ fontWeight: 700 }}>Subtotal: {money(selected.subtotal, selected.currency)}</Typography>
        <Typography>Payment method: {selected.paymentMethod.toUpperCase()}</Typography>
        {selected.payment.transactionId ? <Typography sx={{ overflowWrap: "anywhere" }}>Transaction: {selected.payment.transactionId}</Typography> : null}
        {selected.payment.paidAt ? <Typography>Paid: {date(selected.payment.paidAt)}</Typography> : null}
        {selected.logistics?.logisticsId ? <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={1}>
          <Typography variant="h6">Shipment</Typography>
          <Typography>{selected.logistics.logisticsName} · {selected.logistics.logisticsId}</Typography>
          {safeUrl(selected.logistics.trackingUrl) ? <Button component="a" href={selected.logistics.trackingUrl} target="_blank" rel="noopener noreferrer">Track shipment</Button> : null}
          {selected.logistics.notes ? <Typography>{selected.logistics.notes}</Typography> : null}
        </Stack></Paper> : null}
        {["pending", "rejected"].includes(selected.status) ? <Typography variant="body2" color="text.secondary">Invoices are available after order approval.</Typography> : null}
      </> : null}
    </AppDialog>
  </>;
}
