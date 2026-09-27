import { useRouter } from "next/router";
import { saveGuestCheckout } from "@/hooks/useGuestCheckout";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState, type FormEvent } from "react";
import { AppDialog } from "@/components/common/AppDialog";
import { AppTextField } from "@/components/common/AppTextField";
import { useCart } from "@/hooks/useCart";

const initialForm = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN" };
type Field = keyof typeof initialForm;
export function GuestCheckoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { items } = useCart();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!items.length) { setError("Your cart has expired or is empty. Add products before continuing."); return; }
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as typeof form;
    if (Object.entries(values).some(([key, value]) => key !== "line2" && !value)) { setError("Complete all required fields."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setError("Enter a valid email address."); return; }
    if (!/^\+?[\d\s()-]+$/.test(values.phone) || !/^\d{7,15}$/.test(values.phone.replace(/\D/g, ""))) { setError("Enter a valid phone number, including your country code."); return; }
    const country = values.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) { setError("Enter a two-letter country code, such as IN."); return; }
    if (country === "IN" && !/^\d{6}$/.test(values.postalCode)) { setError("Enter a six-digit PIN code for India."); return; }
    submitting.current = true; setSaving(true);
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const response = await fetch(`${base}/api/users/guest`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone,
          address: { line1: values.line1, line2: values.line2, city: values.city, state: values.state, postalCode: values.postalCode, country } }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.flag === false || result?.error) {
        setError(typeof result?.error === "string" ? result.error : "Unable to save your details. Please try again."); return;
      }
      setSuccess(true);
      try {
        const guestId = result?.user?._id ?? result?.guest?._id ?? result?.data?._id;
        saveGuestCheckout({ name: values.name, email: values.email, phone: values.phone,
          address: { line1: values.line1, line2: values.line2, city: values.city, state: values.state, postalCode: values.postalCode, country },
          ...(typeof guestId === "string" ? { guestId } : {}) });
        await router.push("/checkout");
      } catch {
        setError("Your guest details were saved, but checkout could not open. Enable browser storage and try opening checkout again.");
      }
    } catch { setError("Unable to confirm your details were saved. Please check your connection and try again."); }
    finally { submitting.current = false; setSaving(false); }
  };
  const close = () => { if (!submitting.current) onClose(); };
  const field = (key: Field, label: string, autoComplete: string, full = false) => <Grid key={key} size={{ xs: 12, sm: full ? 12 : 6 }}>
    <AppTextField label={label} name={key} required={key !== "line2"} value={form[key]} autoComplete={autoComplete}
      type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
      onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      helperText={key === "country" ? "Two-letter country code, e.g. IN" : key === "line2" ? "Optional" : undefined}
      slotProps={{ htmlInput: { maxLength: key === "country" ? 2 : undefined } }} />
  </Grid>;
  return <AppDialog open={open} onClose={close} title="Guest checkout" maxWidth="md"
    actions={success ? <Button onClick={() => void router.push("/checkout")} variant="contained">Continue to checkout</Button> : <>
      <Button disabled={saving} onClick={close}>Cancel</Button>
      <Button type="submit" form="guest-checkout-form" variant="contained" disabled={saving || !items.length}>{saving ? "Saving..." : "Save guest details"}</Button>
    </>}>
    {success ? <Stack spacing={2}><Alert severity="success">Your guest details have been saved.</Alert>{error ? <Alert severity="error">{error}</Alert> : null}</Stack> : <>
      <Typography color="text.secondary">Checkout as a guest. Enter your contact details and delivery address.</Typography>
      {!items.length ? <Alert severity="warning">Your cart has expired or is empty. Add products to continue.</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box component="form" id="guest-checkout-form" onSubmit={submit}>
        <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Contact details</Typography>
            <Grid container spacing={2}>{field("name", "Full name", "name", true)}{field("email", "Email", "email")}{field("phone", "Phone", "tel")}</Grid>
            <Typography variant="h6">Delivery address</Typography>
            <Grid container spacing={2}>
              {field("line1", "Address line 1", "address-line1", true)}{field("line2", "Address line 2", "address-line2", true)}
              {field("city", "City", "address-level2")}{field("state", "State", "address-level1")}
              {field("postalCode", "Postal / PIN code", "postal-code")}{field("country", "Country code", "country")}
            </Grid>
          </Stack>
        </Box>
      </Box>
    </>}
  </AppDialog>;
}
