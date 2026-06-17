"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
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
  const { t } = useAdminI18n();
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
      .catch((err) => {
        setDocs([]);
        setStats(null);
        setError(err instanceof Error ? err.message : t("failedToLoadKnowledgeBase"));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
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
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("confirmDeleteDoc"))) return;
    setBusy(true);
    try {
      await deleteKnowledgeDocument(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteFailed"));
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
      setError(err instanceof Error ? err.message : t("reindexFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("knowledgeTitle")}
        description={t("knowledgeDescReindex")}
        actions={
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void handleReindexAll()}>
            {t("reindexAll")}
          </Button>
        }
      />

      {error && !loading ? (
        <Card className="border-accent/40 bg-accent/5">
          <p className="text-sm font-semibold text-accent">{t("couldNotLoadKnowledge")}</p>
          <p className="mt-1 text-sm text-text-muted">{error}</p>
        </Card>
      ) : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label={t("statDocuments")} value={stats.documentCount} />
          <AdminStatCard label={t("statChunks")} value={stats.chunkCount} />
          <AdminStatCard
            label={t("labelLastUpdated")}
            value={stats.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleDateString() : "—"}
          />
        </div>
      ) : null}

      <Card>
        <h2 className="font-semibold">{editingId ? t("editDocument") : t("newDocument")}</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input
            placeholder={t("placeholderTitle")}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Input
            placeholder={t("placeholderCategory")}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <textarea
            className="min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder={t("placeholderContent")}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {editingId ? t("update") : t("create")}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t("cancel")}
              </Button>
            ) : null}
          </div>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-text-muted">{t("loadingDocuments")}</p>
      ) : docs.length === 0 ? (
        <AdminEmptyState title={t("noKnowledgeDocs")} description={t("noKnowledgeDocsDesc")} />
      ) : (
        <AdminTable
          columns={[t("colTitle"), t("colCategory"), t("colUpdated"), t("actions")]}
          rows={docs.map((doc) => [
            <span key="t" className="font-medium">{doc.title}</span>,
            doc.category,
            new Date(doc.updatedAt).toLocaleDateString(),
            <div key="a" className="flex flex-wrap gap-2">
              <button type="button" className="text-xs font-semibold text-primary" onClick={() => startEdit(doc)}>
                {t("edit")}
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-text-muted"
                disabled={busy}
                onClick={() => void reindexKnowledgeDocument(doc.id).then(refresh)}
              >
                {t("reindex")}
              </button>
              <button type="button" className="text-xs font-semibold text-accent" onClick={() => void handleDelete(doc.id)}>
                {t("delete")}
              </button>
            </div>,
          ])}
        />
      )}
    </div>
  );
}
