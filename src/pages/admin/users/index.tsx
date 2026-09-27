import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
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

type UserRole = "admin" | "retailUser" | "wholesaleUser";
type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};
type UserForm = Omit<UserRow, "_id"> & { password: string };
const emptyForm: UserForm = {
  name: "", email: "", password: "", role: "retailUser", isActive: true,
};
const roleLabels: Record<UserRole, string> = {
  admin: "Admin", retailUser: "Retail User", wholesaleUser: "Wholesale User",
};
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const usersUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/users`;
const pageSize = 20;
const columns: DataTableColumn<UserRow>[] = [
  { id: "name", label: "Name", minWidth: 170, render: (row) => row.name },
  { id: "email", label: "Email", minWidth: 220, render: (row) => row.email },
  { id: "role", label: "Role", render: (row) => roleLabels[row.role] ?? row.role },
  { id: "status", label: "Status", render: (row) => (
    <Chip color={row.isActive ? "success" : "default"}
      label={row.isActive ? "Active" : "Inactive"} size="small"
      variant={row.isActive ? "filled" : "outlined"} />
  ) },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadUsers() {
      setLoading(true);
      setListError("");
      try {
        const response = await fetch(`${usersUrl}?page=${page}&limit=${pageSize}`, {
          credentials: "include", signal: controller.signal, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Unable to load users.");
        if (!Array.isArray(result?.users) || typeof result.total !== "number") {
          throw new Error("The server returned an unexpected users response.");
        }
        if (!controller.signal.aborted) {
          setUsers(result.users);
          setTotal(result.total);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setListError(cause instanceof Error ? cause.message : "Unable to load users. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadUsers();
    return () => controller.abort();
  }, [page, refresh]);

  const updateForm = <Key extends keyof UserForm>(key: Key, value: UserForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const closeModal = () => {
    if (submitting.current) return;
    setModalOpen(false);
    setForm(emptyForm);
    setError("");
  };
  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address."); return;
    }
    if (!editingUser && !form.password) { setError("Password is required."); return; }
    submitting.current = true;
    setSaving(true);
    try {
      const response = await fetch(editingUser ? `${usersUrl}/${encodeURIComponent(editingUser._id)}` : usersUrl, {
        method: editingUser ? "PATCH" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive,
          ...(!editingUser || form.password ? { password: form.password } : {}),
        }),
      });
      const result = await response.json().catch(() => null);
      if (editingUser ? !response.ok : response.status !== 201) {
        setError(typeof result?.error === "string" ? result.error : "Unable to save user. Please try again.");
        return;
      }
      // Close only after the server confirms the mutation.
      setModalOpen(false);
      setForm(emptyForm);
      setSuccess(editingUser ? "User updated successfully." : "User created successfully.");
      setEditingUser(null);
      setLoading(true);
      if (!editingUser) setPage(1);
      setRefresh((value) => value + 1);
    } catch {
      setError("Unable to confirm user changes. Check the user list before retrying.");
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
  const deleteUser = async () => {
    if (!deleteTarget || submitting.current) return;
    submitting.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`${usersUrl}/${encodeURIComponent(deleteTarget._id)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setDeleteError(typeof result?.error === "string" ? result.error : "Unable to delete user. Please try again.");
        return;
      }
      setDeleteTarget(null);
      setSuccess("User deleted successfully.");
      setLoading(true);
      if (users.length === 1 && page > 1) setPage((value) => value - 1);
      setRefresh((value) => value + 1);
    } catch {
      setDeleteError("Unable to confirm deletion. Check the user list before retrying.");
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  };
  const userColumns: DataTableColumn<UserRow>[] = [
    ...columns,
    { id: "actions", label: "Actions", render: (user) => (
      <ActionIconButtons
        onEdit={() => {
          setEditingUser(user);
          setForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive, password: "" });
          setError(""); setSuccess(""); setModalOpen(true);
        }}
        onDelete={() => { setDeleteTarget(user); setDeleteError(""); setSuccess(""); }}
      />
    ) },
  ];

  return (
    <>
      <Seo title="Users | VnU Admin" titleSuffix={false} description="Manage VnU user accounts and roles." canonicalPath="/admin/users" noIndex />
      <AdminLayout subtitle="Manage admin, retail and wholesale users." title="Users">
        <Paper sx={{ p: { xs: 2, md: 3 } }} variant="outlined">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
            sx={{ justifyContent: "space-between", mb: 2 }}>
            <Typography color="text.secondary">Registered users</Typography>
            <Button onClick={() => { setEditingUser(null); setForm(emptyForm); setError(""); setSuccess(""); setModalOpen(true); }}
              startIcon={<AddIcon />} variant="contained">Add User</Button>
          </Stack>
          {success ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert> : null}
          {listError ? <Alert severity="error" sx={{ mb: 2 }}
            action={<Button color="inherit" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>Retry</Button>}>
            {listError}
          </Alert> : null}
          <DataTable columns={userColumns} getRowKey={(row) => row._id}
            rows={loading || listError ? [] : users}
            emptyMessage={loading ? "Loading users..." : listError ? "User list unavailable." : "No users yet."} />
          <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center", justifyContent: "flex-end" }}>
            <Button disabled={loading || page === 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
            <Typography variant="body2">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} users</Typography>
            <Button disabled={loading || Boolean(listError) || page * pageSize >= total}
              onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
          </Stack>
        </Paper>
      </AdminLayout>
      <AppDialog open={modalOpen} onClose={closeModal} title={editingUser ? "Edit User" : "Add User"} maxWidth="md"
        actions={<><Button disabled={saving} onClick={closeModal}>Cancel</Button>
          <Button disabled={saving} type="submit" form="create-user-form" variant="contained">
            {saving ? "Saving..." : "Save"}
          </Button></>}>
        <Stack component="form" id="create-user-form" onSubmit={saveUser} spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><AppTextField label="Name" required disabled={saving}
              value={form.name} onChange={(event) => updateForm("name", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><AppTextField label="Email" type="email" required disabled={saving}
              value={form.email} onChange={(event) => updateForm("email", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><AppTextField label="Password" type="password" autoComplete="new-password" required={!editingUser} disabled={saving}
              helperText={editingUser ? "Leave blank to keep the current password." : undefined}
              value={form.password} onChange={(event) => updateForm("password", event.target.value)} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><AppTextField select label="Role" required disabled={saving}
              value={form.role} onChange={(event) => updateForm("role", event.target.value as UserRole)}>
              {Object.entries(roleLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </AppTextField></Grid>
            <Grid size={{ xs: 12, md: 3 }}><AppTextField select label="Status" disabled={saving}
              value={form.isActive ? "active" : "inactive"} onChange={(event) => updateForm("isActive", event.target.value === "active")}>
              <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
            </AppTextField></Grid>
          </Grid>
        </Stack>
      </AppDialog>
      <AppDialog open={Boolean(deleteTarget)} onClose={closeDelete} title="Delete User"
        actions={<><Button disabled={deleting} onClick={closeDelete}>Cancel</Button>
          <Button disabled={deleting} color="error" variant="contained" onClick={deleteUser}>
            {deleting ? "Deleting..." : "Delete"}
          </Button></>}>
        <Stack spacing={2}>
          {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}
          <Typography>Delete {deleteTarget?.name} ({deleteTarget?.email})? This action cannot be undone.</Typography>
        </Stack>
      </AppDialog>
    </>
  );
}
