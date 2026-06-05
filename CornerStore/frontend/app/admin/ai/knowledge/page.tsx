"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { getAdminKnowledgeStats } from "@/lib/services/admin-ai";
import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeDocuments,
  reindexAllKnowledge,
  reindexKnowledgeDocument,
  updateKnowledgeDocument,
} from "@/lib/services/knowledge";
import type { KnowledgeDocumentDTO, KnowledgeStatsDTO } from "@/lib/types";

type DocForm = { title: string; category: string; content: string };

const emptyForm: DocForm = { title: "", category: "FAQ", content: "" };

export default function AdminKnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocumentDTO[]>([]);
  const [stats, setStats] = useState<KnowledgeStatsDTO | null>(null);
  const [form, setForm] = useState<DocForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [documents, knowledgeStats] = await Promise.all([
      getKnowledgeDocuments(),
      getAdminKnowledgeStats(),
    ]);
    setDocs(documents);
    setStats(knowledgeStats);
  }, []);

  useEffect(() => {
    void refresh()
      .catch(() => {
        setDocs([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const startEdit = (doc: KnowledgeDocumentDTO) => {
    setEditingId(doc.id);
    setForm({ title: doc.title, category: doc.category, content: doc.content });
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateKnowledgeDocument(editingId, form);
      } else {
        await createKnowledgeDocument(form);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this document and its chunks?")) return;
    setBusy(true);
    try {
      await deleteKnowledgeDocument(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReindexAll = async () => {
    setBusy(true);
    setError(null);
    try {
      await reindexAllKnowledge();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reindex failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Knowledge Base"
        description="Manage RAG documents for policies, FAQs, and store guides. Changes auto-chunk and re-index."
        actions={
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void handleReindexAll()}>
            Reindex all
          </Button>
        }
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label="Documents" value={stats.documentCount} />
          <AdminStatCard label="Chunks" value={stats.chunkCount} />
          <AdminStatCard
            label="Last updated"
            value={stats.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleDateString() : "—"}
          />
        </div>
      ) : null}

      <Card>
        <h2 className="font-semibold">{editingId ? "Edit document" : "New document"}</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Input
            placeholder="Category (e.g. Shipping, Returns, FAQ)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <textarea
            className="min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {editingId ? "Update" : "Create"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-text-muted">Loading documents…</p>
      ) : docs.length === 0 ? (
        <AdminEmptyState title="No knowledge documents" description="Create your first FAQ or policy document above." />
      ) : (
        <AdminTable
          columns={["Title", "Category", "Updated", "Actions"]}
          rows={docs.map((doc) => [
            <span key="t" className="font-medium">{doc.title}</span>,
            doc.category,
            new Date(doc.updatedAt).toLocaleDateString(),
            <div key="a" className="flex flex-wrap gap-2">
              <button type="button" className="text-xs font-semibold text-primary" onClick={() => startEdit(doc)}>
                Edit
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-text-muted"
                disabled={busy}
                onClick={() => void reindexKnowledgeDocument(doc.id).then(refresh)}
              >
                Reindex
              </button>
              <button type="button" className="text-xs font-semibold text-accent" onClick={() => void handleDelete(doc.id)}>
                Delete
              </button>
            </div>,
          ])}
        />
      )}
    </div>
  );
}
