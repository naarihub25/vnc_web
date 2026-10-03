import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { Seo } from "@/components/site/Seo";
import {
  ActionIconButtons,
  AdminLayout,
  AppCheckbox,
  AppDialog,
  AppTextField,
  DataTable,
  type DataTableColumn,
} from "@/components";

type ParentCategory = { _id: string; name: string };

type Category = {
  _id: string;
  name: string;
  slug: string;
  parentCategory: string | null;
  sortOrder: number;
  isActive: boolean;
  description: string;
  imageUrl: string;
};

type CategoryFormState = {
  name: string;
  slug: string;
  parentCategory: string;
  sortOrder: string;
  isActive: boolean;
  description: string;
  imageUrl: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const categoriesUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/categories`;
const pageSize = 20;

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  parentCategory: "",
  sortOrder: "0",
  isActive: true,
  description: "",
  imageUrl: "",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validImageUrl(value: string) {
  if (value === "") return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

function CategoryImage({ file, url, name }: { file?: File | null; url: string; name: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!file || !imageRef.current) return;
    const objectUrl = URL.createObjectURL(file);
    imageRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const src = validImageUrl(url) ? url : "";
  return file || src ? <Box component="img" ref={imageRef} src={file ? undefined : src} alt={name} sx={{ width: 88, height: 72, objectFit: "cover", borderRadius: 1 }} /> : <Typography color="text.secondary" variant="caption">No image</Typography>;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [parents, setParents] = useState<ParentCategory[]>([]);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [parentsError, setParentsError] = useState("");
  const [parentsRefresh, setParentsRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadParents() {
      setParentsLoading(true);
      setParentsError("");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/categories/parents`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load parent categories.");
        if (!Array.isArray(result?.categories) || !result.categories.every((category: ParentCategory) =>
          category && typeof category._id === "string" && typeof category.name === "string")) {
          throw new Error("The server returned an unexpected parent categories response.");
        }
        if (!controller.signal.aborted) setParents(result.categories);
      } catch (cause) {
        if (!controller.signal.aborted) setParentsError(cause instanceof Error ? cause.message : "Unable to load parent categories.");
      } finally {
        if (!controller.signal.aborted) setParentsLoading(false);
      }
    }
    void loadParents();
    return () => controller.abort();
  }, [parentsRefresh]);

  const excludedParents = new Set<string>();
  if (editingCategory) {
    excludedParents.add(editingCategory._id);
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categories) {
        if (category.parentCategory && excludedParents.has(category.parentCategory) && !excludedParents.has(category._id)) {
          excludedParents.add(category._id);
          changed = true;
        }
      }
    }
  }
  const parentOptions = parents.filter((parent) => !excludedParents.has(parent._id));
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      setLoading(true);
      setListError("");
      try {
        const response = await fetch(`${categoriesUrl}?page=${page}&limit=${pageSize}`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load categories.");
        if (!Array.isArray(result?.categories) || typeof result.total !== "number") {
          throw new Error("The server returned an unexpected categories response.");
        }
        if (!controller.signal.aborted) {
          setCategories(result.categories);
          setTotal(result.total);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setListError(cause instanceof Error ? cause.message : "Unable to load categories.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadCategories();
    return () => controller.abort();
  }, [page, refresh]);

  const closeModal = () => {
    if (submitting.current) return;
    setModalOpen(false);
    setSelectedImage(null);
  };

  const updateForm = <Key extends keyof CategoryFormState>(
    key: Key,
    value: CategoryFormState[Key]
  ) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setSelectedImage(null);
    setSuccess("");
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      parentCategory: category.parentCategory ?? "",
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
    setSelectedImage(null);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const saveCategory = async () => {
    if (submitting.current) return;
    setError("");
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    const name = form.name.trim();
    const slug = form.slug.trim().toLowerCase() || (editingCategory ? "" : slugify(name));
    const description = form.description.trim();
    let imageUrl = form.imageUrl.trim();
    const sortOrder = Number(form.sortOrder);
    if (name.length > 100) { setError("Name must be 100 characters or fewer."); return; }
    if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("Enter a slug of up to 120 characters using lowercase letters, numbers and single hyphens."); return;
    }
    if (categories.some((category) => category._id !== editingCategory?._id && category.slug === slug)) {
      setError("This slug is already in use."); return;
    }
    if (description.length > 2000) { setError("Description must be 2,000 characters or fewer."); return; }
    if (imageUrl.length > 2048 || !validImageUrl(imageUrl)) {
      setError("Enter an HTTP or HTTPS image URL of up to 2,048 characters."); return;
    }
    if (!form.sortOrder.trim() || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000000) {
      setError("Sort order must be a whole number between 0 and 1,000,000."); return;
    }
    if (form.parentCategory && form.parentCategory !== editingCategory?.parentCategory && !parentOptions.some((category) => category._id === form.parentCategory)) {
      setError("Select a valid parent category."); return;
    }
    submitting.current = true;
    setSaving(true);
    try {
      if (selectedImage) {
        const signingResponse = await fetch(`${categoriesUrl}/image-upload-url`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: selectedImage.type, fileSize: selectedImage.size }),
        });
        const signingResult = await signingResponse.json().catch(() => null);
        const upload = signingResult?.data ?? signingResult;
        if (!signingResponse.ok || signingResult?.flag === false || typeof upload?.uploadUrl !== "string" || !upload.uploadUrl || typeof upload?.imageUrl !== "string" || !upload.imageUrl) {
          setError(typeof signingResult?.error === "string" ? signingResult.error : "Unable to prepare the image upload.");
          return;
        }
        const uploadResponse = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        if (!uploadResponse.ok) {
          setError("Unable to upload the image to storage. Please try again.");
          return;
        }
        imageUrl = upload.imageUrl;
        setSelectedImage(null);
        updateForm("imageUrl", imageUrl);
      }
      const response = await fetch(editingCategory ? `${categoriesUrl}/${encodeURIComponent(editingCategory._id)}` : categoriesUrl, {
        method: editingCategory ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentCategory: form.parentCategory || null, name, slug,
          description, imageUrl, sortOrder, isActive: form.isActive }),
      });
      if (response.status !== (editingCategory ? 200 : 201)) {
        const result = await response.json().catch(() => null);
        setError(typeof result?.error === "string" ? result.error : "Unable to save category. Please try again.");
        return;
      }
      setModalOpen(false);
      setForm(emptyForm);
      setSelectedImage(null);
      setSuccess(editingCategory ? "Category updated successfully." : "Category created successfully.");
      setEditingCategory(null);
      setLoading(true);
      if (!editingCategory) setPage(1);
      setRefresh((value) => value + 1);
      setParentsLoading(true);
      setParentsRefresh((value) => value + 1);
    } catch {
      setError("Unable to confirm category changes. Check the category list before retrying.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const closeDelete = () => {
    if (submitting.current) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const deleteCategory = async () => {
    if (!deleteTarget || submitting.current) return;
    submitting.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`${categoriesUrl}/${encodeURIComponent(deleteTarget._id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setDeleteError(typeof result?.error === "string" ? result.error : "Unable to delete category. Please try again.");
        return;
      }
      setDeleteTarget(null);
      setSuccess("Category deleted successfully.");
      setLoading(true);
      if (categories.length === 1 && page > 1) setPage((value) => value - 1);
      setRefresh((value) => value + 1);
      setParentsLoading(true);
      setParentsRefresh((value) => value + 1);
    } catch {
      setDeleteError("Unable to confirm deletion. Check the category list before retrying.");
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Category>[] = [
    { id: "actions", label: "Actions", render: (row) => (
      <ActionIconButtons
        onEdit={() => openEditModal(row)}
        onDelete={() => { setDeleteTarget(row); setDeleteError(""); setSuccess(""); }}
      />
    ) },
    { id: "name", label: "Category", minWidth: 180, render: (row) => row.name },
    { id: "slug", label: "Slug", minWidth: 160, render: (row) => row.slug },
    {
      id: "parent",
      label: "Parent",
      render: (row) =>
        parents.find((category) => category._id === row.parentCategory)?.name ??
        categories.find((category) => category._id === row.parentCategory)?.name ??
        (row.parentCategory ? "Unknown parent" : "Root"),
    },
    { id: "image", label: "Image", render: (row) => (
      <CategoryImage url={row.imageUrl} name={row.name} />
    ) },
    { id: "description", label: "Description", render: (row) => (
      <Typography variant="body2" noWrap sx={{ maxWidth: 240 }} title={row.description}>{row.description || "—"}</Typography>
    ) },
    {
      id: "sortOrder",
      label: "Sort",
      align: "center",
      render: (row) => row.sortOrder,
    },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <Chip
          color={row.isActive ? "success" : "default"}
          label={row.isActive ? "Active" : "Inactive"}
          size="small"
          variant={row.isActive ? "filled" : "outlined"}
        />
      ),
    },

  ];

  return (
    <>
      <Seo title="Categories | VnU Admin" titleSuffix={false} description="Manage VnU product categories." canonicalPath="/admin/categories" noIndex />
      <AdminLayout
        subtitle="Manage parent categories and subcategories."
        title="Categories"
      >
        <Paper sx={{ p: { xs: 2, md: 3 } }} variant="outlined">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography color="text.secondary">
              Browse and create catalog categories.
            </Typography>
            <Button
              onClick={openCreateModal}
              startIcon={<AddIcon />}
              variant="contained"
            >
              Add Category
            </Button>
          </Stack>
          {success ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert> : null}
          {listError ? <Alert severity="error" sx={{ mb: 2 }} action={
            <Button color="inherit" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>
          }>{listError}</Alert> : null}
          <DataTable
            columns={columns}
            emptyMessage={loading ? "Loading categories..." : listError ? "Category list unavailable." : "No categories yet."}
            getRowKey={(row) => row._id}
            rows={loading || listError ? [] : categories}
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center", justifyContent: "flex-end" }}>
            <Button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
            <Typography variant="body2">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} categories</Typography>
            <Button disabled={loading || Boolean(listError) || page * pageSize >= total}
              onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
          </Stack>
        </Paper>
      </AdminLayout>

      <AppDialog
        actions={
          <>
            <Button disabled={saving} onClick={closeModal}>Cancel</Button>
            <Button disabled={saving} onClick={saveCategory} variant="contained">
              {saving ? "Saving..." : "Save"}
            </Button>
          </>
        }
        maxWidth="md"
        onClose={closeModal}
        open={modalOpen}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AppTextField
              label="Name"
              slotProps={{ htmlInput: { maxLength: 100 } }}
              onChange={(event) => updateForm("name", event.target.value)}
              required
              value={form.name}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AppTextField
              label="Slug"
              slotProps={{ htmlInput: { maxLength: 120 } }}
              helperText={editingCategory ? "Unique lowercase slug. Changing the name keeps the existing slug." : "Leave blank to generate from the name."}
              onChange={(event) => updateForm("slug", event.target.value)}
              value={form.slug}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={Boolean(parentsError)}>
              <InputLabel id="parent-category-label">Parent</InputLabel>
              <Select
                disabled={parentsLoading || Boolean(parentsError)}
                label="Parent"
                labelId="parent-category-label"
                onChange={(event) => updateForm("parentCategory", event.target.value)}
                value={form.parentCategory}
              >
                <MenuItem value="">Root (no parent)</MenuItem>
                {form.parentCategory && !parentOptions.some((category) => category._id === form.parentCategory) ? (
                  <MenuItem value={form.parentCategory} disabled>Current parent (not in available options)</MenuItem>
                ) : null}
                {parentOptions.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Leave this unselected to make this a parent category. Select a parent to make it a subcategory.
              </FormHelperText>
              {parentsLoading || parentsError || !parentOptions.length ? (
                <FormHelperText>
                  {parentsLoading ? "Loading parent categories..." : parentsError || "No parent categories available."}
                </FormHelperText>
              ) : null}
            </FormControl>
            {parentsError ? <Button onClick={() => { setParentsLoading(true); setParentsRefresh((value) => value + 1); }}>Retry loading parents</Button> : null}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AppTextField
              label="Sort Order"
              onChange={(event) => updateForm("sortOrder", event.target.value)}
              type="number"
              slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }}
              value={form.sortOrder}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AppCheckbox
              checked={form.isActive}
              label="Active"
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
          </Grid>
          <Grid size={12}>
            <AppTextField label="Description" multiline minRows={3}
              slotProps={{ htmlInput: { maxLength: 2000 } }} value={form.description}
              helperText={`${form.description.length}/2000 characters`}
              onChange={(event) => updateForm("description", event.target.value)} />
          </Grid>
          <Grid size={12}>
            <Stack spacing={2}>
              <AppTextField label="Image URL" value={form.imageUrl}
                slotProps={{ htmlInput: { maxLength: 2048 } }}
                helperText="Optional HTTP or HTTPS image URL."
                onChange={(event) => { setSelectedImage(null); updateForm("imageUrl", event.target.value); }} />
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Button component="label" variant="outlined">
                  {selectedImage || form.imageUrl ? "Replace image" : "Upload image"}
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
                      setError("Choose a PNG, JPEG, WebP or GIF image."); return;
                    }
                    if (file.size > 5 * 1024 * 1024) { setError("Choose an image smaller than 5 MB."); return; }
                    setError(""); setSelectedImage(file); updateForm("imageUrl", "");
                  }} />
                </Button>
                {selectedImage || form.imageUrl ? <Button onClick={() => { setSelectedImage(null); updateForm("imageUrl", ""); }}>Remove image</Button> : null}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                PNG, JPEG, WebP or GIF, up to 5 MB. The image uploads when you save the category.
              </Typography>
              {selectedImage ? <Typography variant="body2">{selectedImage.name}</Typography> : null}
              <CategoryImage file={selectedImage} url={form.imageUrl} name={form.name || "Category"} />
            </Stack>
          </Grid>
        </Grid>
        </Box>
      </AppDialog>
      <AppDialog
        open={Boolean(deleteTarget)}
        onClose={closeDelete}
        title="Delete Category"
        actions={
          <>
            <Button disabled={deleting} onClick={closeDelete}>Cancel</Button>
            <Button disabled={deleting} color="error" variant="contained" onClick={deleteCategory}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
          <Typography>Delete category “{deleteTarget?.name}”? This action cannot be undone.</Typography>
        </Stack>
      </AppDialog>

    </>
  );
}
