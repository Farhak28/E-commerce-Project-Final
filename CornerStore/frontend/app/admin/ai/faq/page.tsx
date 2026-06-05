"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeDocuments,
  updateKnowledgeDocument,
} from "@/lib/services/knowledge";
import type { KnowledgeDocumentDTO } from "@/lib/types";

export default function AdminFaqPage() {
  const [docs, setDocs] = useState<KnowledgeDocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<KnowledgeDocumentDTO | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await getKnowledgeDocuments("FAQ"));
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (editing) {
      await updateKnowledgeDocument(editing.id, { ...form, category: "FAQ" });
    } else {
      await createKnowledgeDocument({ ...form, category: "FAQ" });
    }
    setEditing(null);
    setForm({ title: "", content: "" });
    await load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQ Management"
        description="Manage frequently asked questions used by the AI assistant and help content."
        actions={
          <Link href="/admin/ai/knowledge" className="text-sm font-semibold text-primary">
            All knowledge docs →
          </Link>
        }
      />
      <AdminStatCard label="FAQ entries" value={docs.length} />
      {(editing || form.title || form.content) && (
        <Card className="space-y-3">
          <Input placeholder="Question / title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea
            className="min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Answer"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => void save()}>Save FAQ</Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm({ title: "", content: "" }); }}>Cancel</Button>
          </div>
        </Card>
      )}
      {!editing && !form.title && !form.content && (
        <Button type="button" onClick={() => setForm({ title: "", content: "" })}>Add FAQ</Button>
      )}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <AdminTable
          columns={["Question", "Updated", ""]}
          rows={docs.map((d) => [
            d.title,
            new Date(d.updatedAt).toLocaleDateString(),
            <div key="a" className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => { setEditing(d); setForm({ title: d.title, content: d.content }); }}>Edit</Button>
              <Button type="button" variant="ghost" onClick={() => void deleteKnowledgeDocument(d.id).then(load)}>Delete</Button>
            </div>,
          ])}
          emptyMessage="No FAQ entries yet. Add questions customers ask most often."
        />
      )}
    </div>
  );
}
