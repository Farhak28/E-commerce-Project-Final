"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminPagination, AdminSearchBar } from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "@/lib/services/admin";
import type { AdminUserDTO } from "@/lib/types";

type UserFormState = {
  email: string;
  displayName: string;
  phoneNumber: string;
  password: string;
  roles: string[];
};

const emptyForm: UserFormState = {
  email: "",
  displayName: "",
  phoneNumber: "",
  password: "",
  roles: [],
};

const ROLE_OPTIONS = ["Admin", "SuperAdmin"] as const;

function toForm(user: AdminUserDTO): UserFormState {
  return {
    email: user.email,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber ?? "",
    password: "",
    roles: user.roles.filter((r) => ROLE_OPTIONS.includes(r as (typeof ROLE_OPTIONS)[number])),
  };
}

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const load = async (p = page, q = appliedSearch) => {
    setLoading(true);
    try {
      const data = await getAdminUsers({ search: q || undefined, page: p, pageSize });
      setUsers(data.items);
      setTotalCount(data.totalCount);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page, appliedSearch);
  }, [page, appliedSearch]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (user: AdminUserDTO) => {
    setEditingId(user.id);
    setForm(toForm(user));
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId != null) {
        await updateAdminUser(editingId, {
          displayName: form.displayName.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          roles: form.roles,
          password: form.password.trim() || undefined,
        });
      } else {
        if (!form.password.trim()) {
          setError("Password is required for new users.");
          setSaving(false);
          return;
        }
        await createAdminUser({
          email: form.email.trim(),
          displayName: form.displayName.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          password: form.password,
          roles: form.roles,
        });
      }
      closeForm();
      await load(page, appliedSearch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Delete user "${email}"?`)) return;
    setError(null);
    try {
      await deleteAdminUser(id);
      if (editingId === id) closeForm();
      await load(page, appliedSearch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete user.");
    }
  };

  return (
    <div className="space-y-6">
      <AdminSearchBar
        value={search}
        onChange={setSearch}
        onSubmit={() => {
          setPage(1);
          setAppliedSearch(search);
        }}
        placeholder="Search users…"
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" onClick={openCreate}>
          Add user
        </Button>
      </div>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      {showForm ? (
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold">
              {editingId != null ? "Edit user" : "New user"}
            </h2>

            {editingId == null ? (
              <label className="block space-y-1 text-sm">
                <span className="text-text-muted">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </label>
            ) : (
              <p className="text-sm text-text-muted">Email: {form.email}</p>
            )}

            <label className="block space-y-1 text-sm">
              <span className="text-text-muted">Display name</span>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                required
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-text-muted">Phone</span>
              <Input
                value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-text-muted">
                {editingId != null ? "New password (optional)" : "Password"}
              </span>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required={editingId == null}
                minLength={6}
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm text-text-muted">Roles (leave empty for customer)</p>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId != null ? "Update user" : "Create user"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading users…</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-text-muted">{user.email}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Roles: {user.roles.join(", ") || "Customer"} · Orders: {user.ordersCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => openEdit(user)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void handleDelete(user.id, user.email)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
