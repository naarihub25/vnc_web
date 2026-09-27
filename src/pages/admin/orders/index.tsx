import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Seo } from "@/components/site/Seo";
import { AdminLayout, AppDialog, AppTextField, DataTable, type DataTableColumn } from "@/components";

type LogisticsDetails = {
  logisticsName: string;
  logisticsId: string;
  trackingUrl: string;
  notes: string;
};

type Order = {
  _id: string; customer: { name: string; email: string; phone: string };
  shippingAddress: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
  items: { product: string; name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }[];
  currency: string; subtotal: number; paymentMethod: string; payment: { status: string };
  status: string; createdAt: string;
  reason?: string;
  statusReason?: string;
  logistics?: LogisticsDetails;
};
type OrderAction = "approve" | "ship" | "deliver" | "reject" | "cancel";
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
};
function Status({ value }: { value: string }) {
  return <Chip size="small" label={value} sx={{ textTransform: "capitalize" }}
    color={value === "shipped" || value === "delivered" || value === "paid" ? "success" : value === "approved" ? "primary" : value === "cancelled" || value === "rejected" || value === "failed" ? "error" : "warning"} />;
}
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [action, setAction] = useState<{ type: OrderAction; order: Order } | null>(null);
  const [reason, setReason] = useState("");
  const [logistics, setLogistics] = useState<LogisticsDetails>({ logisticsName: "", logisticsId: "", trackingUrl: "", notes: "" });
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionSaving, setActionSaving] = useState(false);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const response = await fetch(`${base}/api/orders?page=${page}&limit=20`, { credentials: "include", cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok || result?.flag === false) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load orders.");
        if (!Array.isArray(result?.orders) || typeof result.total !== "number") throw new Error("Unexpected orders response.");
        if (!controller.signal.aborted) {
          setOrders(result.orders); setTotal(result.total);
          setPages(Math.max(1, result.totalPages ?? Math.ceil(result.total / (result.limit || 20))));
        }
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load orders."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [page, refresh]);
  const openAction = (type: OrderAction, order: Order) => {
    setAction({ type, order });
    setReason("");
    setLogistics({ logisticsName: "", logisticsId: "", trackingUrl: "", notes: "" });
    setActionError("");
  };
  const closeAction = () => {
    if (actionSaving) return;
    setAction(null);
    setActionError("");
  };
  const updateOrderStatus = async () => {
    if (!action) return;
    const cleanReason = reason.trim();
    const cleanLogistics = Object.fromEntries(
      Object.entries(logistics).map(([key, value]) => [key, value.trim()])
    ) as LogisticsDetails;
    if ((action.type === "reject" || action.type === "cancel") && !cleanReason) {
      setActionError(`Enter a reason for ${action.type === "reject" ? "rejecting" : "cancelling"} this order.`);
      return;
    }
    if (action.type === "ship") {
      if (!cleanLogistics.logisticsName || !cleanLogistics.logisticsId) {
        setActionError("Logistics provider and logistics / tracking ID are required before marking an order as shipped.");
        return;
      }
      if (cleanLogistics.trackingUrl) {
        try {
          if (!["http:", "https:"].includes(new URL(cleanLogistics.trackingUrl).protocol)) throw new Error();
        } catch {
          setActionError("Enter a valid HTTP or HTTPS tracking URL.");
          return;
        }
      }
    }
    const nextStatus = action.type === "approve" ? "approved" : action.type === "ship" ? "shipped" : action.type === "deliver" ? "delivered" : action.type === "reject" ? "rejected" : "cancelled";
    const body = {
      status: nextStatus,
      ...((action.type === "reject" || action.type === "cancel") ? { reason: cleanReason } : {}),
      ...(action.type === "ship" ? { logistics: cleanLogistics } : {}),
    };
    setActionSaving(true);
    setActionError("");
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const response = await fetch(`${base}/api/orders/${encodeURIComponent(action.order._id)}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.flag === false || result?.error) {
        setActionError(typeof result?.error === "string" ? result.error : "Unable to update the order status. Please try again.");
        return;
      }
      setAction(null);
      setSelected(null);
      setNotice(`Order ${action.order._id} was marked as ${nextStatus}.`);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch {
      setActionError("Unable to confirm the order update. Refresh the order list before retrying.");
    } finally {
      setActionSaving(false);
    }
  };
  const downloadInvoice = async (order: Order) => {
    if (invoiceLoadingId) return;
    setInvoiceLoadingId(order._id);
    setInvoiceError("");
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const response = await fetch(`${base}/api/orders/${encodeURIComponent(order._id)}/invoice`, {
        credentials: "include",
        headers: { Accept: "application/pdf" },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setInvoiceError(typeof result?.error === "string" ? result.error : "Unable to download the invoice. Please try again.");
        return;
      }
      const blob = await response.blob();
      if (!blob.size) {
        setInvoiceError("The invoice response was empty. Please try again.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(`Invoice for order ${order._id} was downloaded.`);
    } catch {
      setInvoiceError("Unable to download the invoice. Check your connection and try again.");
    } finally {
      setInvoiceLoadingId("");
    }
  };
  const invoiceAvailable = (status: string) => ["approved", "shipped", "delivered"].includes(status);
  const orderActions = (order: Order) => <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
    <Button size="small" onClick={() => setSelected(order)}>View</Button>
    {invoiceAvailable(order.status) ? <Button
      size="small"
      variant="outlined"
      disabled={Boolean(invoiceLoadingId)}
      onClick={() => void downloadInvoice(order)}
    >
      {invoiceLoadingId === order._id ? "Downloading..." : "Print invoice"}
    </Button> : null}
    {order.status === "pending" ? <>
      <Button size="small" variant="contained" onClick={() => openAction("approve", order)}>Approve</Button>
      <Button size="small" color="error" onClick={() => openAction("reject", order)}>Reject</Button>
    </> : null}
    {order.status === "approved" ? <>
      <Button size="small" color="success" variant="contained" onClick={() => openAction("ship", order)}>Ship</Button>
      <Button size="small" color="error" onClick={() => openAction("cancel", order)}>Cancel</Button>
    </> : null}
    {order.status === "shipped" ? <Button
      size="small"
      color="success"
      variant="contained"
      onClick={() => openAction("deliver", order)}
    >
      Mark delivered
    </Button> : null}
  </Stack>;
  const columns: DataTableColumn<Order>[] = [
    { id: "id", label: "Order", render: (order) => <Typography variant="body2" sx={{ overflowWrap: "anywhere", maxWidth: 200 }}>{order._id}</Typography> },
    { id: "customer", label: "Customer", minWidth: 190, render: (order) => <><Typography variant="body2">{order.customer.name}</Typography><Typography variant="caption" color="text.secondary">{order.customer.email}</Typography></> },
    { id: "date", label: "Placed", render: (order) => new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { id: "quantity", label: "Items", render: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0) },
    { id: "amount", label: "Subtotal", render: (order) => money(order.subtotal, order.currency) },
    { id: "payment", label: "Payment", render: (order) => <Stack spacing={1}><Typography variant="caption">{order.paymentMethod.toUpperCase()}</Typography><Status value={order.payment.status} /></Stack> },
    { id: "status", label: "Order status", render: (order) => <Status value={order.status} /> },
    { id: "actions", label: "Actions", minWidth: 220, render: orderActions },
  ];
  return <>
    <Seo title="Orders | VnU Admin" titleSuffix={false} description="Review and fulfil VnU customer orders." canonicalPath="/admin/orders" noIndex />
    <AdminLayout title="Orders" subtitle="Review customer orders, payment and fulfilment status.">
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}><Typography color="text.secondary">{total} orders</Typography><Button disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Refresh</Button></Stack>
        {error ? <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>}>{error}</Alert> : null}
        {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert> : null}
        {invoiceError ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setInvoiceError("")}>{invoiceError}</Alert> : null}
        <DataTable rows={loading || error ? [] : orders} columns={columns} getRowKey={(order) => order._id} emptyMessage={loading ? "Loading orders..." : error ? "Order list unavailable." : "No orders yet."} />
        <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: "flex-end", alignItems: "center" }}>
          <Button disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
          <Typography variant="body2">Page {page} of {pages}</Typography>
          <Button disabled={loading || Boolean(error) || page >= pages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
        </Stack>
      </Paper>
    </AdminLayout>
    <AppDialog open={Boolean(selected)} onClose={() => setSelected(null)} title="Order details" maxWidth="md" actions={<Button onClick={() => setSelected(null)}>Close</Button>}>
      {selected ? <>
        <Typography variant="body2">Order ID: {selected._id}</Typography>
        <Stack direction="row" spacing={1}><Status value={selected.status} /><Status value={selected.payment.status} /></Stack>
        <Typography variant="h6">Customer & delivery</Typography>
        <Typography>{selected.customer.name} · {selected.customer.email} · {selected.customer.phone}</Typography>
        <Typography>{[selected.shippingAddress.line1, selected.shippingAddress.line2, selected.shippingAddress.city, selected.shippingAddress.state, selected.shippingAddress.postalCode, selected.shippingAddress.country].filter(Boolean).join(", ")}</Typography>
        <Divider />
        <DataTable rows={selected.items} getRowKey={(item) => `${item.product}:${item.sku}`} columns={[
          { id: "name", label: "Product", render: (item) => item.name },
          { id: "sku", label: "SKU", render: (item) => item.sku },
          { id: "quantity", label: "Quantity", render: (item) => item.quantity },
          { id: "price", label: "Unit price", render: (item) => money(item.unitPrice, selected.currency) },
          { id: "total", label: "Total", render: (item) => money(item.lineTotal, selected.currency) },
        ]} />
        <Typography sx={{ fontWeight: 700 }}>Subtotal: {money(selected.subtotal, selected.currency)} · {selected.paymentMethod.toUpperCase()}</Typography>
        {selected.reason || selected.statusReason ? <Alert severity={selected.status === "cancelled" || selected.status === "rejected" ? "error" : "info"}>
          <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }}>{selected.status} reason</Typography>
          {selected.reason ?? selected.statusReason}
        </Alert> : null}
        {selected.logistics ? <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Logistics details</Typography>
          <Typography>Provider: {selected.logistics.logisticsName}</Typography>
          <Typography>Logistics ID: {selected.logistics.logisticsId}</Typography>
          {selected.logistics.trackingUrl ? <Typography component="a" href={selected.logistics.trackingUrl} target="_blank" rel="noopener noreferrer" color="primary">Track shipment</Typography> : null}
          {selected.logistics.notes ? <Typography color="text.secondary" sx={{ mt: 1 }}>{selected.logistics.notes}</Typography> : null}
        </Paper> : null}
        {orderActions(selected)}
      </> : null}
    </AppDialog>
    <AppDialog
      open={Boolean(action)}
      onClose={closeAction}
      title={action ? `${action.type === "ship" ? "Ship" : action.type === "deliver" ? "Mark delivered" : action.type.charAt(0).toUpperCase() + action.type.slice(1)} order` : "Update order"}
      actions={<>
        <Button disabled={actionSaving} onClick={closeAction}>Cancel</Button>
        <Button
          color={action?.type === "reject" || action?.type === "cancel" ? "error" : action?.type === "ship" || action?.type === "deliver" ? "success" : "primary"}
          variant="contained"
          disabled={actionSaving}
          onClick={updateOrderStatus}
        >
          {actionSaving ? "Saving..." : action?.type === "approve" ? "Approve order" : action?.type === "ship" ? "Mark as shipped" : action?.type === "deliver" ? "Confirm delivery" : action?.type === "reject" ? "Reject order" : "Cancel order"}
        </Button>
      </>}
    >
      {action ? <>
        <Alert severity="info">The customer-facing notification can use the reason or logistics details saved with this status update.</Alert>
        <Box>
          <Typography variant="body2" color="text.secondary">Order</Typography>
          <Typography sx={{ overflowWrap: "anywhere" }}>{action.order._id}</Typography>
          <Typography sx={{ mt: 1 }}>{action.order.customer.name} · {money(action.order.subtotal, action.order.currency)}</Typography>
        </Box>
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}
        {action.type === "approve" ? <Typography>Approve this order so it can move to fulfilment and shipping?</Typography> : null}
        {action.type === "deliver" ? <Alert severity="warning">
          Confirm that this order was delivered to the customer.
          {action.order.paymentMethod === "cod" ? " This is a COD order, so confirming delivery will also mark its payment as completed." : ""}
        </Alert> : null}
        {action.type === "ship" ? <Stack spacing={2}>
          <AppTextField disabled={actionSaving} label="Logistics provider" required value={logistics.logisticsName}
            placeholder="Blue Dart"
            onChange={(event) => setLogistics((current) => ({ ...current, logisticsName: event.target.value }))} />
          <AppTextField disabled={actionSaving} label="Logistics / tracking ID" required value={logistics.logisticsId}
            placeholder="AWB123456789"
            onChange={(event) => setLogistics((current) => ({ ...current, logisticsId: event.target.value }))} />
          <AppTextField disabled={actionSaving} label="Tracking URL" type="url" value={logistics.trackingUrl}
            helperText="Optional HTTP or HTTPS tracking link shared with the customer."
            onChange={(event) => setLogistics((current) => ({ ...current, trackingUrl: event.target.value }))} />
          <AppTextField disabled={actionSaving} label="Logistics notes" multiline minRows={3} value={logistics.notes}
            helperText="Optional note about shipment or delivery instructions."
            onChange={(event) => setLogistics((current) => ({ ...current, notes: event.target.value }))} />
        </Stack> : null}
        {action.type === "reject" || action.type === "cancel" ? <AppTextField
          label={action.type === "reject" ? "Rejection reason" : "Cancellation reason"}
          disabled={actionSaving} required multiline minRows={4} value={reason}
          helperText="Required. This reason can be included in customer email notifications later."
          onChange={(event) => setReason(event.target.value)}
        /> : null}
      </> : null}
    </AppDialog>
  </>;
}
