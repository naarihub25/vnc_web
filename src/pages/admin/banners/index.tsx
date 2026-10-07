import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Seo } from "@/components/site/Seo";
import { ActionIconButtons, AdminLayout, AppDialog, AppTextField, DataTable, type DataTableColumn } from "@/components";

type BannerImage = { id: string; url: string; alt: string; file?: File };
type Banner = {
  _id: string;
  sortOrder: number;
  title: string;
  images: BannerImage[];
  redirectUrl: string;
  isActive: boolean;
  position: "carousal" | "offerBanner";
};
type BannerForm = Omit<Banner, "_id" | "sortOrder"> & { sortOrder: string };
const emptyForm = (): BannerForm => ({ sortOrder: "0", title: "", images: [], redirectUrl: "", isActive: true, position: "carousal" });
const positions = { carousal: "Carousel", offerBanner: "Offer Banner" };
function isHttpUrl(value: string) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
function validDestination(value: string) {
  if (/\s|\\/.test(value)) return false;
  return (value.startsWith("/") && !value.startsWith("//")) || isHttpUrl(value);
}
function BannerPreview({ image, title }: { image: BannerImage; title: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!image.file || !ref.current) return;
    const url = URL.createObjectURL(image.file);
    ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image.file]);
  return image.file || isHttpUrl(image.url) ? <Box component="img" ref={ref}
    src={image.file ? undefined : image.url} alt={image.alt || title || "Banner preview"}
    sx={{ width: 160, height: 80, objectFit: "cover", borderRadius: 1 }} /> : null;
}

const bannersUrl = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/banners`;
const pageSize = 20;

export default function AdminBanners() {
  // Image IDs only identify local form rows and are never sent to the API.
  const imageIdSequence = useRef(0);
  const nextImageId = () => `banner-image-${++imageIdSequence.current}`;
  const newImage = (): BannerImage => ({ id: nextImageId(), url: "", alt: "" });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const submitting = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    async function loadBanners() {
      setLoading(true); setListError("");
      try {
        const response = await fetch(`${bannersUrl}?page=${page}&limit=${pageSize}`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load banners.");
        if (!Array.isArray(result?.banners) || typeof result.total !== "number") throw new Error("Unexpected banners response.");
        if (!controller.signal.aborted) { setBanners(result.banners); setTotal(result.total); }
      } catch (cause) {
        if (!controller.signal.aborted) setListError(cause instanceof Error ? cause.message : "Unable to load banners.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadBanners();
    return () => controller.abort();
  }, [page, refresh]);

  const update = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateImage = (id: string, changes: Partial<BannerImage>) => setForm((current) => ({
    ...current, images: current.images.map((image) => image.id === id ? { ...image, ...changes } : image),
  }));
  const openCreate = () => {
    setEditing(null); setForm({ ...emptyForm(), images: [newImage()] });
    setError(""); setSuccess(""); setOpen(true);
  };
  const openEdit = (banner: Banner) => {
    setEditing(banner); setForm({ ...banner, sortOrder: String(banner.sortOrder),
      images: [banner.images[0] ? { ...banner.images[0], id: nextImageId() } : newImage()],
    });
    setError(""); setSuccess(""); setOpen(true);
  };
  const closeModal = () => { if (submitting.current) return; setOpen(false); setForm(emptyForm()); setEditing(null); };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const sortOrder = Number(form.sortOrder);
    if (!form.sortOrder.trim() || !Number.isSafeInteger(sortOrder) || sortOrder < 0) { setError("Sort order must be a non-negative whole number."); return; }
    const title = form.title.trim();
    const redirectUrl = form.redirectUrl.trim();
    if (!title) { setError("Enter a banner title."); return; }
    if (!validDestination(redirectUrl)) { setError("Enter a site path such as /products, or a full HTTP/HTTPS URL."); return; }
    if (form.images.length !== 1 || (!form.images[0].file && !isHttpUrl(form.images[0].url.trim()))) {
      setError("Upload one banner image or provide a valid HTTP/HTTPS URL."); return;
    }
    const banner = { title, redirectUrl, sortOrder,
      position: form.position, isActive: form.isActive,
      images: form.images.map((image) => ({ url: image.url.trim(), alt: image.alt.trim() })),
    };
    submitting.current = true;
    setSaving(true);
    try {
      const image = form.images[0];
      if (image.file) {
        setUploading(true);
        const uploadForm = new FormData();
        uploadForm.append("files", image.file);
        let uploadResponse: Response;
        try {
          uploadResponse = await fetch(`${bannersUrl}/image-upload-url`, {
            method: "POST", credentials: "include", body: uploadForm,
          });
        } catch {
          setError("Unable to upload the banner image. Check your connection and try again.");
          return;
        }
        const uploadResult = await uploadResponse.json().catch(() => null);
        const upload = uploadResult?.data ?? uploadResult;
        if (!uploadResponse.ok || uploadResult?.flag === false) {
          setError(typeof uploadResult?.error === "string" ? uploadResult.error : "Unable to upload the banner image. Please try again.");
          return;
        }
        if (!Array.isArray(upload?.images) || upload.images.length !== 1 ||
          typeof upload.images[0]?.url !== "string" || !isHttpUrl(upload.images[0].url) ||
          typeof upload.images[0]?.alt !== "string") {
          setError("The server returned an unexpected image upload response. Please try again.");
          return;
        }
        const uploadedImage = { url: upload.images[0].url, alt: image.alt.trim() || upload.images[0].alt };
        banner.images = [uploadedImage];
        updateImage(image.id, { ...uploadedImage, file: undefined });
        setUploading(false);
      }
      const response = await fetch(editing ? `${bannersUrl}/${encodeURIComponent(editing._id)}` : bannersUrl, {
        method: editing ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(banner),
      });
      if (editing ? !response.ok : response.status !== 201) {
        const result = await response.json().catch(() => null);
        setError(typeof result?.error === "string" ? result.error : "Unable to save banner. Please try again.");
        return;
      }
      setOpen(false); setForm(emptyForm()); setEditing(null);
      setSuccess(editing ? "Banner updated successfully." : "Banner created successfully.");
      setLoading(true);
      if (!editing) setPage(1);
      setRefresh((value) => value + 1);
    } catch {
      setError("Unable to confirm banner changes. Check the list before retrying.");
    } finally { submitting.current = false; setSaving(false); setUploading(false); }
  };
  const closeDelete = () => { if (!submitting.current) { setDeleteTarget(null); setDeleteError(""); } };
  const deleteBanner = async () => {
    if (!deleteTarget || submitting.current) return;
    submitting.current = true; setDeleting(true); setDeleteError("");
    try {
      const response = await fetch(`${bannersUrl}/${encodeURIComponent(deleteTarget._id)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setDeleteError(typeof result?.error === "string" ? result.error : "Unable to delete banner. Please try again.");
        return;
      }
      setDeleteTarget(null); setSuccess("Banner deleted successfully."); setLoading(true);
      if (banners.length === 1 && page > 1) setPage((value) => value - 1);
      setRefresh((value) => value + 1);
    } catch { setDeleteError("Unable to confirm deletion. Check the list before retrying."); }
    finally { submitting.current = false; setDeleting(false); }
  };
  const columns: DataTableColumn<Banner>[] = [
    { id: "images", label: "Image", render: (banner) => <Stack spacing={0.5}>
      {banner.images[0] ? <BannerPreview image={banner.images[0]} title={banner.title} /> : null}<Typography variant="caption">{banner.images.length} image(s)</Typography>
    </Stack> },
    { id: "title", label: "Title", minWidth: 180, render: (banner) => banner.title },
    { id: "position", label: "Position", render: (banner) => positions[banner.position] },
    { id: "destination", label: "Redirection URL", minWidth: 200, render: (banner) => <Box component="a" href={validDestination(banner.redirectUrl) ? banner.redirectUrl : undefined}
      target="_blank" rel="noopener noreferrer" sx={{ color: "primary.main", overflowWrap: "anywhere" }}>{banner.redirectUrl}</Box> },
    { id: "sortOrder", label: "Sort order", render: (banner) => banner.sortOrder },
    { id: "status", label: "Status", render: (banner) => <Chip label={banner.isActive ? "Active" : "Inactive"} color={banner.isActive ? "success" : "default"} size="small" /> },
    { id: "actions", label: "Actions", render: (banner) => <ActionIconButtons onEdit={() => openEdit(banner)} onDelete={() => { setDeleteTarget(banner); setDeleteError(""); setSuccess(""); }} /> },
  ];
  return <>
    <Seo title="Banners | VnU Admin" titleSuffix={false} description="Manage VnU promotional banners." canonicalPath="/admin/banners" noIndex />
    <AdminLayout title="Banners" subtitle="Manage carousel and offer banners and their destinations.">
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 2 }}>
          <Typography color="text.secondary">Browse and manage banners.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Banner</Button>
        </Stack>
        {success ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert> : null}
        {listError ? <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" disabled={loading}
          onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>}>{listError}</Alert> : null}
        <DataTable columns={columns} rows={loading || listError ? [] : banners} getRowKey={(banner) => banner._id}
          emptyMessage={loading ? "Loading banners..." : listError ? "Banner list unavailable." : "No banners yet."} />
        <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center", justifyContent: "flex-end" }}>
          <Button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
          <Typography variant="body2">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} banners</Typography>
          <Button disabled={loading || Boolean(listError) || page * pageSize >= total}
            onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
        </Stack>
      </Paper>
    </AdminLayout>
    <AppDialog open={open} onClose={closeModal} title={editing ? "Edit Banner" : "Add Banner"} maxWidth="md"
      actions={<><Button disabled={saving} onClick={closeModal}>Cancel</Button><Button disabled={saving} type="submit" form="banner-form" variant="contained">{uploading ? "Uploading image..." : saving ? "Saving..." : "Save"}</Button></>}>
      <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack component="form" id="banner-form" onSubmit={save} spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <AppTextField label="Image title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
        <AppTextField label="Redirection URL" required value={form.redirectUrl} onChange={(e) => update("redirectUrl", e.target.value)}
          helperText="Where this banner should go when clicked: a site path such as /products, or a full https:// URL." />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}><AppTextField select label="Position" value={form.position} onChange={(e) => update("position", e.target.value as Banner["position"])}>
            <MenuItem value="carousal">Carousel</MenuItem><MenuItem value="offerBanner">Offer Banner</MenuItem>
          </AppTextField></Grid>
          <Grid size={{ xs: 12, md: 6 }}><AppTextField select label="Status" value={form.isActive ? "active" : "inactive"} onChange={(e) => update("isActive", e.target.value === "active")}>
            <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </AppTextField></Grid>
        </Grid>
        <AppTextField label="Sort order" required type="number" value={form.sortOrder}
          slotProps={{ htmlInput: { min: 0, step: 1 } }} onChange={(e) => update("sortOrder", e.target.value)} />
        <Typography variant="h6">Banner image</Typography>
        {editing && editing.images.length > 1 ? <Alert severity="info">This banner has multiple images. Saving will keep only the image shown below.</Alert> : null}
        {form.images.map((image) => <Paper key={image.id} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <AppTextField label="Image URL" value={image.url} onChange={(e) => updateImage(image.id, { url: e.target.value, file: undefined })}
              helperText="Enter an HTTP/HTTPS URL or choose an image file below." />
            <AppTextField label="Alt text" value={image.alt} onChange={(e) => updateImage(image.id, { alt: e.target.value })} />
            <Stack direction="row" spacing={1}>
              <Button component="label" variant="outlined">{image.file ? "Replace image" : "Upload image"}
                <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
                    setError("Choose a PNG, JPEG, WebP or GIF image up to 5 MB."); return;
                  }
                  setError(""); updateImage(image.id, { file, url: "" });
                }} />
              </Button>
              <Button color="error" onClick={() => update("images", [newImage()])}>Remove</Button>
            </Stack>
            {image.file ? <Typography variant="caption">{image.file.name}</Typography> : null}
            <BannerPreview image={image} title={form.title} />
          </Stack>
        </Paper>)}
        <Typography variant="caption" color="text.secondary">Choose a PNG, JPEG, WebP or GIF image up to 5 MB. The image uploads when you save the banner.</Typography>
      </Stack>
      </Box>
    </AppDialog>
    <AppDialog open={Boolean(deleteTarget)} onClose={closeDelete} title="Delete Banner"
      actions={<><Button disabled={deleting} onClick={closeDelete}>Cancel</Button>
        <Button disabled={deleting} color="error" variant="contained" onClick={deleteBanner}>{deleting ? "Deleting..." : "Delete"}</Button></>}>
      {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
      <Typography>Delete “{deleteTarget?.title}”? This action cannot be undone.</Typography>
    </AppDialog>
  </>;
}
