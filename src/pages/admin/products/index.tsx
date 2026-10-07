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
import { ActionIconButtons, AdminLayout, AppCheckbox, AppDialog, AppTextField, DataTable, type DataTableColumn } from "@/components";

type ProductImage = { url: string; alt: string };
type Product = {
  _id: string; name: string; slug: string; sku: string; category: string;
  hsnCode?: string; cgst?: number; sgst?: number;
  productType: string; description: string; images: ProductImage[]; currency: string;
  isRetail: boolean; retailPrice?: number; isWholesale: boolean; wholesalePrice?: number;
  minWholesaleQty?: number; stockQuantity: number; isActive: boolean; isTrending: boolean; isRecommended: boolean;
};
type ProductForm = Omit<Product, "_id" | "hsnCode" | "cgst" | "sgst" | "retailPrice" | "wholesalePrice" | "minWholesaleQty" | "stockQuantity"> & {
  hsnCode: string; cgst: string; sgst: string;
  retailPrice: string; wholesalePrice: string; minWholesaleQty: string; stockQuantity: string;
};
type CategoryOption = { _id: string; name: string; parentCategory: string | null };
const emptyForm = (): ProductForm => ({
  hsnCode: "", cgst: "0", sgst: "0",
  name: "", slug: "", sku: "", category: "", productType: "", description: "",
  images: [{ url: "", alt: "" }], currency: "INR", isRetail: true, retailPrice: "",
  isWholesale: false, wholesalePrice: "", minWholesaleQty: "", stockQuantity: "0", isActive: true, isTrending: false, isRecommended: false,
});
const slugify = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function validUrl(value: string) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
function validPrice(value: string) {
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) && number >= 0 && number <= 1000000000 &&
    Math.abs(number * 100 - Math.round(number * 100)) < 0.0001;
}
function validInteger(value: string, min: number) {
  const number = Number(value);
  return value.trim() !== "" && Number.isInteger(number) && number >= min && number <= 1000000000;
}

const productsUrl = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/products`;
const pageSize = 20;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const submitting = useRef(false);
  const closeModal = () => { if (!submitting.current) setOpen(false); };

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      setLoading(true);
      setListError("");
      try {
        const response = await fetch(`${productsUrl}?page=${page}&limit=${pageSize}`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load products.");
        if (!Array.isArray(result?.products) || typeof result.total !== "number") throw new Error("Unexpected products response.");
        if (!controller.signal.aborted) { setProducts(result.products); setTotal(result.total); }
      } catch (cause) {
        if (!controller.signal.aborted) setListError(cause instanceof Error ? cause.message : "Unable to load products.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, [page, refresh]);


  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
        const options: CategoryOption[] = [];
        let page = 1;
        while (!controller.signal.aborted) {
          const response = await fetch(`${base}/api/categories?page=${page}&limit=100`, {
            credentials: "include", cache: "no-store", signal: controller.signal,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load categories.");
          if (!Array.isArray(result?.categories) || typeof result.total !== "number") throw new Error("Unexpected category response.");
          options.push(...result.categories);
          if (options.length >= result.total) break;
          if (!result.categories.length) throw new Error("Unable to load all categories. Please retry.");
          page += 1;
        }
        if (!controller.signal.aborted) setCategories(options);
      } catch (cause) {
        if (!controller.signal.aborted) setCategoriesError(cause instanceof Error ? cause.message : "Unable to load categories.");
      } finally {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      }
    }
    void loadCategories();
    return () => controller.abort();
  }, [retry]);

  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateImage = (index: number, key: keyof ProductImage, value: string) => setForm((current) => ({
    ...current, images: current.images.map((image, i) => i === index ? { ...image, [key]: value } : image),
  }));
  const moveImage = (index: number, delta: number) => setForm((current) => {
    const images = [...current.images];
    [images[index], images[index + delta]] = [images[index + delta], images[index]];
    return { ...current, images };
  });
  const openCreate = () => { setEditing(null); setSelectedFiles([]); setForm(emptyForm()); setError(""); setSuccess(""); setOpen(true); };
  const openEdit = (product: Product) => {
    setEditing(product);
    setSelectedFiles([]);
    setForm({
      ...product,
      hsnCode: product.hsnCode ?? "",
      cgst: product.cgst?.toString() ?? "0",
      sgst: product.sgst?.toString() ?? "0",
      images: product.images.map((image) => ({ ...image })),
      retailPrice: product.retailPrice?.toString() ?? "",
      wholesalePrice: product.wholesalePrice?.toString() ?? "",
      minWholesaleQty: product.minWholesaleQty?.toString() ?? "",
      stockQuantity: String(product.stockQuantity),
      isRecommended: product.isRecommended ?? false,
      isTrending: product.isTrending ?? false,
    });
    setError(""); setSuccess(""); setOpen(true);
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const name = form.name.trim();
    const slug = form.slug.trim().toLowerCase() || (editing ? "" : slugify(name));
    const hsnCode = form.hsnCode.trim();
    const sku = form.sku.trim().toUpperCase();
    const productType = form.productType.trim();
    const description = form.description.trim();
    const currency = form.currency.trim().toUpperCase();
    const images = form.images.map((image) => ({ url: image.url.trim(), alt: image.alt.trim() }))
      .filter((image) => image.url || image.alt);
    let message = "";
    if (!name || name.length > 200) message = "Enter a product name of up to 200 characters.";
    else if (slug.length > 240 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) message = "Enter a slug of up to 240 characters using lowercase letters, numbers and single hyphens.";
    else if (!sku || sku.length > 100) message = "Enter a SKU of up to 100 characters.";
    else if (products.some((p) => p._id !== editing?._id && (p.slug === slug || p.sku === sku))) message = "Another product already uses this slug or SKU.";
    else if (!/^(?:[0-9]{2}|[0-9]{4}|[0-9]{6}|[0-9]{8})?$/.test(hsnCode)) message = "HSN code must be empty or contain 2, 4, 6 or 8 digits.";
    else if (!validPrice(form.cgst) || Number(form.cgst) > 100) message = "CGST must be between 0 and 100 with at most two decimal places.";
    else if (!validPrice(form.sgst) || Number(form.sgst) > 100) message = "SGST must be between 0 and 100 with at most two decimal places.";
    else if (!categories.some((c) => c._id === form.category)) message = "Select one category or subcategory.";
    else if (!productType || productType.length > 100) message = "Enter a product type of up to 100 characters.";
    else if (description.length > 10000) message = "Description must be 10,000 characters or fewer.";
    else if (images.length + selectedFiles.length < 1 || images.length + selectedFiles.length > 5 || images.some((i) => !validUrl(i.url) || i.url.length > 2048 || i.alt.length > 200)) message = "Add 1–5 images using uploads or HTTP/HTTPS URLs (up to 2,048 characters each), with alt text up to 200 characters.";
    else if (!/^[A-Z]{3}$/.test(currency)) message = "Currency must be a three-letter code, such as INR.";
    else if (!form.isRetail && !form.isWholesale) message = "Enable retail, wholesale, or both.";
    else if ((form.isRetail || form.retailPrice.trim() !== "") && !validPrice(form.retailPrice)) message = "Retail price must be between 0 and 1,000,000,000 with at most two decimal places.";
    else if ((form.isWholesale || form.wholesalePrice.trim() !== "") && !validPrice(form.wholesalePrice)) message = "Wholesale price must be between 0 and 1,000,000,000 with at most two decimal places.";
    else if ((form.isWholesale || form.minWholesaleQty.trim() !== "") && !validInteger(form.minWholesaleQty, 1)) message = "Minimum wholesale quantity must be a whole number from 1 to 1,000,000,000.";
    else if (!validInteger(form.stockQuantity, 0)) message = "Stock quantity must be a whole number from 0 to 1,000,000,000.";
    if (message) { setError(message); return; }
    const product: Omit<Product, "_id"> = {
      hsnCode, cgst: Number(form.cgst), sgst: Number(form.sgst),
      name, slug, sku, category: form.category,
      productType, description, images, currency, isRetail: form.isRetail, isWholesale: form.isWholesale,
      ...(form.retailPrice.trim() !== "" ? { retailPrice: Number(form.retailPrice) } : {}),
      ...(form.wholesalePrice.trim() !== "" ? { wholesalePrice: Number(form.wholesalePrice) } : {}),
      ...(form.minWholesaleQty.trim() !== "" ? { minWholesaleQty: Number(form.minWholesaleQty) } : {}),
      stockQuantity: Number(form.stockQuantity), isActive: form.isActive,
      isTrending: form.isTrending, isRecommended: form.isRecommended,
    };
    submitting.current = true;
    setSaving(true);
    try {
      if (selectedFiles.length) {
        setUploading(true);
        const uploadForm = new FormData();
        for (const file of selectedFiles) uploadForm.append("files", file);
        const uploadResponse = await fetch(`${productsUrl}/image-upload-url`, {
          method: "POST", credentials: "include", body: uploadForm,
        });
        const uploadResult = await uploadResponse.json().catch(() => null);
        const upload = uploadResult?.data ?? uploadResult;
        if (!uploadResponse.ok || uploadResult?.flag === false) {
          setError(typeof uploadResult?.error === "string" ? uploadResult.error : "Unable to upload images. Please try again.");
          return;
        }
        if (!Array.isArray(upload?.images) || upload.images.length !== selectedFiles.length ||
          !upload.images.every((image: ProductImage) => image && typeof image.url === "string" && validUrl(image.url) &&
            image.url.length <= 2048 && typeof image.alt === "string" && image.alt.length <= 200)) {
          setError("The server returned an unexpected image upload response. Please try again.");
          return;
        }
        product.images = [...images, ...upload.images.map((image: ProductImage) => ({ url: image.url, alt: image.alt }))];
        update("images", product.images);
        setSelectedFiles([]);
        setUploading(false);
      }
      const response = await fetch(editing ? `${productsUrl}/${encodeURIComponent(editing._id)}` : productsUrl, {
        method: editing ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (editing ? !response.ok : response.status !== 201) {
        const result = await response.json().catch(() => null);
        setError(typeof result?.error === "string" ? result.error : "Unable to save product. Please try again.");
        return;
      }
      setOpen(false);
      setForm(emptyForm());
      setSuccess(editing ? "Product updated successfully." : "Product created successfully.");
      setEditing(null);
      setLoading(true);
      if (!editing) setPage(1);
      setRefresh((value) => value + 1);
    } catch {
      setError("Unable to confirm product changes. Check the product list before retrying.");
    } finally {
      submitting.current = false;
      setSaving(false);
      setUploading(false);
    }
  };

  const closeDelete = () => {
    if (submitting.current) return;
    setDeleteTarget(null);
    setDeleteError("");
  };
  const deleteProduct = async () => {
    if (!deleteTarget || submitting.current) return;
    submitting.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`${productsUrl}/${encodeURIComponent(deleteTarget._id)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setDeleteError(typeof result?.error === "string" ? result.error : "Unable to delete product. Please try again.");
        return;
      }
      setDeleteTarget(null);
      setSuccess("Product deleted successfully.");
      setLoading(true);
      if (products.length === 1 && page > 1) setPage((value) => value - 1);
      setRefresh((value) => value + 1);
    } catch {
      setDeleteError("Unable to confirm deletion. Check the product list before retrying.");
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  };
  const columns: DataTableColumn<Product>[] = [
    { id: "actions", label: "Actions", render: (product) => <ActionIconButtons
      onEdit={() => openEdit(product)}
      onDelete={() => { setDeleteTarget(product); setDeleteError(""); setSuccess(""); }} /> },
    { id: "image", label: "Image", render: (p) => <Box component="img" src={p.images[0].url} alt={p.images[0].alt || p.name} sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1 }} /> },
    { id: "name", label: "Product", minWidth: 180, render: (p) => <><Typography variant="body2">{p.name}</Typography><Typography variant="caption" color="text.secondary">{p.slug}</Typography></> },
    { id: "sku", label: "SKU", render: (p) => p.sku },
    { id: "hsnCode", label: "HSN code", render: (p) => p.hsnCode || "—" },
    { id: "cgst", label: "CGST", render: (p) => `${p.cgst ?? 0}%` },
    { id: "sgst", label: "SGST", render: (p) => `${p.sgst ?? 0}%` },
    { id: "category", label: "Category", render: (p) => categories.find((c) => c._id === p.category)?.name ?? p.category },
    { id: "type", label: "Type", render: (p) => p.productType },
    { id: "retail", label: "Retail", render: (p) => p.isRetail ? `${p.currency} ${p.retailPrice?.toFixed(2)}` : "—" },
    { id: "wholesale", label: "Wholesale", render: (p) => p.isWholesale ? <>{p.currency} {p.wholesalePrice?.toFixed(2)}<Typography variant="caption" sx={{ display: "block" }}>Min. {p.minWholesaleQty} units</Typography></> : "—" },
    { id: "stock", label: "Stock", render: (p) => p.stockQuantity },
    { id: "status", label: "Status", render: (p) => <Chip size="small" color={p.isActive ? "success" : "default"} label={p.isActive ? "Active" : "Inactive"} /> },
    { id: "featured", label: "Highlights", render: (p) => <Stack spacing={0.5}>
      {p.isRecommended ? <Chip size="small" label="Recommended" color="primary" variant="outlined" /> : null}
      {p.isTrending ? <Chip size="small" label="Trending" color="secondary" variant="outlined" /> : null}
      {!p.isRecommended && !p.isTrending ? "—" : null}
    </Stack> },
  ];
  const textField = (key: "hsnCode" | "name" | "slug" | "sku" | "productType" | "currency", label: string, maxLength: number, required = true) => (
    <Grid size={{ xs: 12, md: 6 }}><AppTextField label={label} required={required} value={form[key]}
      slotProps={{ htmlInput: { maxLength } }} onChange={(e) => update(key, e.target.value)}
      helperText={key === "slug" ? (editing ? "Changing the name keeps the existing slug." : "Leave blank to generate from the name.") : key === "sku" || key === "currency" ? "Saved in uppercase." : undefined} /></Grid>
  );
  const numberField = (key: "cgst" | "sgst" | "retailPrice" | "wholesalePrice" | "minWholesaleQty" | "stockQuantity", label: string, min = 0, step = 1, max = 1000000000) => (
    <Grid size={{ xs: 12, md: 6 }}><AppTextField label={label} required type="number" value={form[key]}
      slotProps={{ htmlInput: { min, max, step } }} onChange={(e) => update(key, e.target.value)} /></Grid>
  );

  return <>
    <Seo title="Products | VnU Admin" titleSuffix={false} description="Manage VnU products, pricing and inventory." canonicalPath="/admin/products" noIndex />
    <AdminLayout title="Products" subtitle="Manage product details, pricing and stock.">
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 2 }}>
          <Typography color="text.secondary">Browse and create products.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Product</Button>
        </Stack>
        {success ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert> : null}
        {listError ? <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" disabled={loading}
          onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>}>{listError}</Alert> : null}
        <DataTable columns={columns} rows={loading || listError ? [] : products} getRowKey={(p) => p._id}
          emptyMessage={loading ? "Loading products..." : listError ? "Product list unavailable." : "No products yet. Add a product to get started."} />
        <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center", justifyContent: "flex-end" }}>
          <Button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
          <Typography variant="body2">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} products</Typography>
          <Button disabled={loading || Boolean(listError) || page * pageSize >= total}
            onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
        </Stack>
      </Paper>
    </AdminLayout>
    <AppDialog open={open} onClose={closeModal} title={editing ? "Edit Product" : "Add Product"} maxWidth="md"
      actions={<><Button disabled={saving} onClick={closeModal}>Cancel</Button><Button disabled={saving} type="submit" form="product-form" variant="contained">{uploading ? "Uploading images..." : saving ? "Saving..." : "Save"}</Button></>}>
      <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack component="form" id="product-form" onSubmit={save} spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Typography variant="h6">Product details</Typography>
        <Grid container spacing={2}>
          {textField("name", "Name", 200)}{textField("slug", "Slug", 240, Boolean(editing))}
          {textField("sku", "SKU", 100)}{textField("productType", "Product type", 100)}
          <Grid size={12}><AppTextField select required label="Category or subcategory" value={form.category}
            disabled={categoriesLoading || Boolean(categoriesError)} onChange={(e) => update("category", e.target.value)}
            helperText={categoriesLoading ? "Loading categories..." : categoriesError || (!categories.length ? "Create a category before adding products." : "Choose exactly one category or subcategory.")}>
            {form.category && !categories.some((c) => c._id === form.category) ? <MenuItem value={form.category} disabled>Category unavailable</MenuItem> : null}
            {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.parentCategory ? `${categories.find((p) => p._id === c.parentCategory)?.name ?? "Subcategory"} / ` : ""}{c.name}</MenuItem>)}
          </AppTextField>
            {categoriesError ? <Button onClick={() => setRetry((value) => value + 1)}>Retry categories</Button> : null}
          </Grid>
          <Grid size={12}><AppTextField label="Description" multiline minRows={3} value={form.description}
            slotProps={{ htmlInput: { maxLength: 10000 } }} helperText={`${form.description.length}/10000 characters`}
            onChange={(e) => update("description", e.target.value)} /></Grid>
        </Grid>
        <Stack spacing={2}>
          <Typography variant="h6">Product images</Typography>
          <Typography variant="body2" color="text.secondary">Upload or enter URLs for 1–5 images. The first image is the main product image. New uploads are added after existing images.</Typography>
          <AppTextField type="file" label="Upload product images" slotProps={{ inputLabel: { shrink: true }, htmlInput: {
            multiple: true, accept: "image/png,image/jpeg,image/webp,image/gif",
          } }} helperText="PNG, JPEG, WebP or GIF, up to 5 MB each. Images upload when you save the product."
            onChange={(event) => {
              const files = Array.from((event.target as HTMLInputElement).files ?? []);
              event.target.value = "";
              if (!files.length) return;
              const existingCount = form.images.filter((image) => image.url.trim() || image.alt.trim()).length;
              if (existingCount + selectedFiles.length + files.length > 5) { setError("A product can have up to 5 images, including existing images."); return; }
              if (files.some((file) => !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024)) {
                setError("Choose PNG, JPEG, WebP or GIF images up to 5 MB each."); return;
              }
              setError(""); setSelectedFiles((current) => [...current, ...files]);
            }} />
          {selectedFiles.map((file, index) => <Stack key={index} direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography sx={{ overflowWrap: "anywhere" }}>{file.name}</Typography>
            <Button color="error" onClick={() => setSelectedFiles((current) => current.filter((_, i) => i !== index))}>Remove</Button>
          </Stack>)}
          {form.images.map((image, index) => <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2">{index === 0 ? "Main image" : `Image ${index + 1}`}</Typography>
              <AppTextField label="Image URL" value={image.url} slotProps={{ htmlInput: { maxLength: 2048 } }}
                helperText="Use an HTTP or HTTPS URL." onChange={(e) => updateImage(index, "url", e.target.value)} />
              <AppTextField label="Alt text" value={image.alt} slotProps={{ htmlInput: { maxLength: 200 } }} onChange={(e) => updateImage(index, "alt", e.target.value)} />
              {validUrl(image.url) ? <Box component="img" src={image.url} alt={image.alt || `Product image ${index + 1}`} sx={{ width: 100, height: 100, objectFit: "cover", borderRadius: 1 }} /> : null}
              <Stack direction="row" spacing={1}>
                <Button disabled={index === 0} onClick={() => moveImage(index, -1)}>Move earlier</Button>
                <Button disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)}>Move later</Button>
                <Button color="error" disabled={form.images.length === 1} onClick={() => update("images", form.images.filter((_, i) => i !== index))}>Remove</Button>
              </Stack>
            </Stack>
          </Paper>)}
          <Button variant="outlined" disabled={form.images.length + selectedFiles.length >= 5} onClick={() => update("images", [...form.images, { url: "", alt: "" }])}>Add image ({form.images.length}/5)</Button>
        </Stack>
        <Typography variant="h6">Tax details</Typography>
        <Grid container spacing={2}>
          {textField("hsnCode", "HSN code", 8, false)}
          {numberField("cgst", "CGST (%)", 0, 0.01, 100)}
          {numberField("sgst", "SGST (%)", 0, 0.01, 100)}
        </Grid>
        <Typography variant="h6">Pricing and availability</Typography>
        <Grid container spacing={2}>
          {textField("currency", "Currency", 3)}{numberField("stockQuantity", "Stock quantity")}
          <Grid size={12}><AppCheckbox label="Available for retail" checked={form.isRetail} onChange={(e) => update("isRetail", e.target.checked)} /></Grid>
          {form.isRetail ? numberField("retailPrice", "Retail price", 0, 0.01) : null}
          <Grid size={12}><AppCheckbox label="Available for wholesale" checked={form.isWholesale} onChange={(e) => update("isWholesale", e.target.checked)} /></Grid>
          {form.isWholesale ? <>{numberField("wholesalePrice", "Wholesale price", 0, 0.01)}{numberField("minWholesaleQty", "Minimum wholesale quantity", 1)}</> : null}
          {!form.isRetail && !form.isWholesale ? <Grid size={12}><Alert severity="warning">Enable retail, wholesale, or both.</Alert></Grid> : null}
          <Grid size={{ xs: 12, md: 6 }}><AppCheckbox label="Recommended" checked={form.isRecommended} onChange={(e) => update("isRecommended", e.target.checked)} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><AppCheckbox label="Trending" checked={form.isTrending} onChange={(e) => update("isTrending", e.target.checked)} /></Grid>
          <Grid size={12}><AppCheckbox label="Active" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} /></Grid>
        </Grid>
      </Stack>
      </Box>
    </AppDialog>
    <AppDialog open={Boolean(deleteTarget)} onClose={closeDelete} title="Delete Product"
      actions={<><Button disabled={deleting} onClick={closeDelete}>Cancel</Button>
        <Button disabled={deleting} color="error" variant="contained" onClick={deleteProduct}>
          {deleting ? "Deleting..." : "Delete"}
        </Button></>}>
      {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
      <Typography>Delete “{deleteTarget?.name}” ({deleteTarget?.sku})? This action cannot be undone.</Typography>
    </AppDialog>

  </>;
}
